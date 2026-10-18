import type { Token } from '../linter/linterEngine.js';
import type {
  BloggerDataType,
  BloggerHoverResult,
  BloggerProperty,
  BloggerResolveResult,
  BloggerSuggestion,
} from '../models/types.js';
import type { BloggerIncludablesInfo, BloggerResolverContext, LocalVariablesResolver } from './hoverCardResolver.js';
import type { PropertyNavigationResult } from './propertyHierarchy.js';
import type { TagAttributeContext } from './tagAttributeResolver.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { getNearestUnclosedTag } from 'blogger-spec/parser';
import { tokenizeExpression } from 'blogger-spec/quota';
import { getCompatibleOperatorNames } from 'blogger-spec/type-system';
import {
  detectLambdaPreArrowContext,
  extractLeftOperandAtCursor,
  extractPrecedingExpressionForMember,
  inferExpressionType,
  inferSingularParamName,
  resolveCollectionProperty,
  resolveLambdaContextAtCursor,
} from '../parser/exprParser.js';
import {
  bloggerGlobalRoot,
  getCategorizedPropertyMembers,
  WIDGET_DATA_DICTIONARIES,
} from './dataModel.js';
import {
  resolveHoverAtPosition as resolveHoverAtPositionDirect,
  resolveLocalVariables,
} from './hoverCardResolver.js';
import { navigatePropertyPath } from './propertyHierarchy.js';

import { bloggerTags, hasAttributeValueCompletions, isExpressionAttribute, parseTagAttributeContext, resolveBloggerTagSuggestions, resolveDefaultMarkupTypesSuggestions, resolveDescriptionsSuggestions, resolveSkinVariableTypesSuggestions, resolveTagAttributeSuggestions, resolveWidgetTypesSuggestions } from './tagAttributeResolver.js';

export {
  hasAttributeValueCompletions,
  isExpressionAttribute,
  parseTagAttributeContext,
};
export type {
  BloggerIncludablesInfo,
  BloggerResolverContext,
  LocalVariablesResolver,
  TagAttributeContext,
};

function matchAttributeValue(linePrefix: string): { attrName: string; typedText: string; beforeAttr: string } | undefined {
  const doubleMatch = /\b([\w:-]+)\s*=\s*"([^"]*)$/.exec(linePrefix);
  const singleMatch = /\b([\w:-]+)\s*=\s*'([^']*)$/.exec(linePrefix);

  if (doubleMatch && singleMatch) {
    return doubleMatch.index > singleMatch.index
      ? { attrName: doubleMatch[1]!, typedText: doubleMatch[2]!, beforeAttr: linePrefix.slice(0, doubleMatch.index) }
      : { attrName: singleMatch[1]!, typedText: singleMatch[2]!, beforeAttr: linePrefix.slice(0, singleMatch.index) };
  }

  const match = doubleMatch ?? singleMatch;
  if (match && match[1] && match[2] !== undefined) {
    return {
      attrName: match[1],
      typedText: match[2],
      beforeAttr: linePrefix.slice(0, match.index),
    };
  }

  return undefined;
}
const TAG_CONTEXT_REGEX = /<([\w:-]+)(?:\s[^>]*)?$/;
const DATA_PREFIX_REGEX = /(?:^|[^\w:.])(data:[[\]\w.]*)$/;
const TAG_PREFIX_REGEX = /(?:^|[^\w:])(?:(<\/|<)([\w:-]*)|(b:[\w-]*|data:?|Variable\w*|Group\w*))$/i;
const OPERAND_START_TRIGGER_REGEX = /(?:^|[=?:,(+\-*/%]|\b(?:and|or|not|eq|neq|lt|lte|gt|gte|to|in|contains)\b)\s*([a-zA-Z_!=]*)$/;

const OPERAND_EXPECTING_TOKEN_TYPES = new Set([
  'OPERATOR_TERNARY_SELECT',
  'OPERATOR_TERNARY_BRANCH',
  'OPERATOR_ELVIS',
  'OPERATOR_ARITHMETIC',
  'OPERATOR_RELATIONAL',
  'OPERATOR_LOGICAL',
  'OPERATOR_LOGICAL_JS',
  'OPERATOR_MEMBERSHIP',
  'OPERATOR_COLLECTION',
  'DELIMITER_COMMA',
  'GROUPING_PAREN_OPEN',
  'CONTAINER_ARRAY',
  'CONTAINER_OBJECT',
]);

function detectOperandPosition(expressionText: string): { isOperandStart: boolean; typedPrefix: string } {
  if (!expressionText || !expressionText.trim()) {
    return { isOperandStart: true, typedPrefix: '' };
  }

  let tokens: Token[] = [];
  try {
    tokens = tokenizeExpression(expressionText);
  }
  catch {
    // Gracefully fallback to regex on tokenization error
  }

  if (tokens.length > 0) {
    const lastToken = tokens[tokens.length - 1]!;

    if (lastToken.tokenType === 'STRING_LITERAL') {
      const val = lastToken.value;
      const isUnclosed = val.length === 1 || val[0] !== val[val.length - 1];
      if (isUnclosed) {
        return { isOperandStart: false, typedPrefix: '' };
      }
    }

    if (lastToken.tokenType === 'DATA_PATH') {
      return { isOperandStart: false, typedPrefix: '' };
    }

    const hasTrailingSpace = /\s$/.test(expressionText);

    // If only 1 token and no trailing space, user is typing an operand/functional operator at expression start
    if (tokens.length === 1 && !hasTrailingSpace) {
      if (['IDENTIFIER', 'NATIVE_FUNCTION', 'BOOLEAN_LITERAL', 'OPERATOR_LOGICAL', 'OPERATOR_RELATIONAL'].includes(lastToken.tokenType)) {
        return { isOperandStart: true, typedPrefix: lastToken.value };
      }
    }

    // If multiple tokens and no trailing space, check if the previous token was expecting an operand
    if (tokens.length > 1 && !hasTrailingSpace) {
      const prevToken = tokens[tokens.length - 2]!;
      if (OPERAND_EXPECTING_TOKEN_TYPES.has(prevToken.tokenType)) {
        if (['IDENTIFIER', 'NATIVE_FUNCTION', 'BOOLEAN_LITERAL', 'OPERATOR_LOGICAL', 'OPERATOR_RELATIONAL'].includes(lastToken.tokenType)) {
          return { isOperandStart: true, typedPrefix: lastToken.value };
        }
      }
    }

    if (OPERAND_EXPECTING_TOKEN_TYPES.has(lastToken.tokenType)) {
      return { isOperandStart: true, typedPrefix: '' };
    }
  }

  const operandStartMatch = OPERAND_START_TRIGGER_REGEX.exec(expressionText);
  if (operandStartMatch) {
    return { isOperandStart: true, typedPrefix: operandStartMatch[1] ?? '' };
  }

  return { isOperandStart: false, typedPrefix: '' };
}

export class BloggerPathResolver {
  private readonly rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot;

  private mapPropertyToSuggestion(prop: BloggerProperty, basePath?: string): BloggerSuggestion {
    return {
      name: prop.name,
      type: prop.type,
      description: prop.description,
      example: prop.example ?? (basePath ? `data:${basePath}.${prop.name}` : `data:${prop.name}`),
      deprecated: prop.deprecated,
      kind: 'property',
    };
  }

  private navigatePath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
  ): PropertyNavigationResult | undefined {
    return navigatePropertyPath(segments, localVariables, this.rootTree);
  }

  public resolvePropertyFromPath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
  ): BloggerProperty | undefined {
    if (segments.length === 0) {
      return undefined;
    }
    return this.navigatePath(segments, localVariables)?.target;
  }

  public resolveDataPath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
    widgetType?: string,
  ): readonly BloggerSuggestion[] {
    if (segments.length === 0) {
      const suggestions: BloggerSuggestion[] = [];
      const widgetDict = widgetType && WIDGET_DATA_DICTIONARIES[widgetType] ? WIDGET_DATA_DICTIONARIES[widgetType] : undefined;
      const seen = new Set<string>();

      if (localVariables) {
        for (const [name, prop] of Object.entries(localVariables)) {
          seen.add(name);
          const isGlobal = Boolean(this.rootTree[name]);
          const isWidget = Boolean(widgetDict && widgetDict[name]);
          if (!isGlobal && !isWidget) {
            suggestions.push({
              name: prop.name,
              type: prop.type,
              description: prop.description ?? `Template variable \`${prop.name}\`.`,
              example: `data:${prop.name}`,
              deprecated: prop.deprecated,
              kind: 'variable',
              categoryBadge: 'Local',
              sortPriority: 0,
            });
          }
          else if (isWidget) {
            suggestions.push({
              name: prop.name,
              type: prop.type,
              description: prop.description,
              example: `data:${prop.name}`,
              deprecated: prop.deprecated,
              kind: 'property',
              categoryBadge: widgetType ? `Widget: ${widgetType}` : 'Widget',
              sortPriority: 10,
            });
          }
        }
      }

      for (const [name, prop] of Object.entries(this.rootTree)) {
        if (!seen.has(name) || (localVariables && !widgetDict?.[name] && name === 'widget')) {
          suggestions.push({
            name: prop.name,
            type: prop.type,
            description: prop.description,
            example: `data:${prop.name}`,
            deprecated: prop.deprecated,
            kind: 'property',
            detail: `(Blogger Global: ${prop.name})`,
            categoryBadge: 'Global',
            sortPriority: 20,
          });
        }
      }

      return suggestions;
    }

    const node = this.navigatePath(segments, localVariables);
    if (!node?.target || !node?.children) {
      return [];
    }

    const basePath = segments.join('.');
    const categorized = getCategorizedPropertyMembers(node.target);
    if (categorized && categorized.length > 0) {
      return categorized.map(m => ({
        name: m.property.name,
        type: m.property.type,
        description: m.property.description,
        example: m.property.example ?? `data:${basePath}.${m.property.name}`,
        deprecated: m.property.deprecated,
        kind: 'property',
        detail: `(Blogger Data: ${m.property.type.charAt(0).toUpperCase() + m.property.type.slice(1)})`,
        categoryBadge: m.categoryBadge,
        sortPriority: m.sortPriority,
      }));
    }

    return Object.values(node.children).map(prop => ({
      ...this.mapPropertyToSuggestion(prop, basePath),
      categoryBadge: 'Property',
      sortPriority: 0,
    }));
  }

  private resolveDataOrLambda(
    text: string,
    localVariables?: Record<string, BloggerProperty>,
    widgetType?: string,
  ): BloggerResolveResult | undefined {
    // 1. Data path context (data: or data:path. or data:path.partial)
    const dataMatch = DATA_PREFIX_REGEX.exec(text);
    if (dataMatch && dataMatch[1] !== undefined) {
      const fullExpression = dataMatch[1];
      const rawPath = fullExpression.slice('data:'.length);

      if (rawPath === '') {
        return {
          suggestions: this.resolveDataPath([], localVariables, widgetType),
          replacementLength: 0,
        };
      }

      if (rawPath.endsWith('.')) {
        const normalized = rawPath.slice(0, -1).replace(/\[/g, '.').replace(/\]/g, '');
        const segments = normalized.split('.').filter(Boolean);
        return {
          suggestions: this.resolveDataPath(segments, localVariables, widgetType),
          replacementLength: 0,
        };
      }

      const normalized = rawPath.replace(/\[/g, '.').replace(/\]/g, '');
      const segments = normalized.split('.').filter(Boolean);
      const lastSegment = segments.pop() ?? '';
      return {
        suggestions: this.resolveDataPath(segments, localVariables, widgetType),
        replacementLength: lastSegment.length,
      };
    }

    // 2. Lambda context (p => p.member or p => p)
    const lambdaContext = resolveLambdaContextAtCursor(text, text.length, localVariables);
    if (lambdaContext) {
      if (lambdaContext.isNavigatingMember && lambdaContext.targetProperty) {
        const categorized = getCategorizedPropertyMembers(lambdaContext.targetProperty);
        const suggestions: BloggerSuggestion[] = categorized && categorized.length > 0
          ? categorized.map(m => ({
              name: m.property.name,
              type: m.property.type,
              description: m.property.description,
              example: `${lambdaContext.activeParam}.${m.property.name}`,
              kind: 'property' as const,
              deprecated: m.property.deprecated,
              categoryBadge: m.categoryBadge,
              sortPriority: m.sortPriority,
            }))
          : Object.values(lambdaContext.targetProperty.children ?? {}).map(prop => ({
              name: prop.name,
              type: prop.type,
              description: prop.description,
              example: `${lambdaContext.activeParam}.${prop.name}`,
              kind: 'property' as const,
              deprecated: prop.deprecated,
              categoryBadge: 'Property',
              sortPriority: 0,
            }));
        return {
          suggestions,
          replacementLength: lambdaContext.currentToken.length,
        };
      }
      if (!lambdaContext.isNavigatingMember) {
        const varSuggestions: BloggerSuggestion[] = Object.entries(lambdaContext.activeScopes).map(([pName, prop]) => ({
          name: pName,
          type: prop.type,
          kind: 'variable' as const,
          description: prop.description ?? `Lambda parameter \`${pName}\`.`,
          example: pName,
          categoryBadge: 'Lambda',
          sortPriority: 0,
        }));
        const dataPrefixSuggestion: BloggerSuggestion = {
          name: 'data:',
          type: 'object',
          kind: 'property',
          detail: '(Blogger Data Prefix)',
          description: 'Blogger data expression prefix.',
          example: 'data:blog.title',
          categoryBadge: 'Prefix',
          sortPriority: 5,
        };
        const suggestions = [...varSuggestions, dataPrefixSuggestion];
        const filtered = lambdaContext.currentToken
          ? suggestions.filter(s => s.name.startsWith(lambdaContext.currentToken))
          : suggestions;
        if (filtered.length > 0) {
          return {
            suggestions: filtered,
            replacementLength: lambdaContext.currentToken.length,
          };
        }
      }
    }

    return undefined;
  }

  public resolveExpressionContext(
    expressionText: string,
    localVariables?: Record<string, BloggerProperty>,
    isLoopContext: boolean = false,
    lineSuffix?: string,
    widgetType?: string,
  ): BloggerResolveResult | undefined {
    const dataOrLambda = this.resolveDataOrLambda(expressionText, localVariables, widgetType);
    if (dataOrLambda) {
      return dataOrLambda;
    }

    // 2.5. Incomplete Lambda pre-arrow context (e.g. data:posts first ( or data:posts first (p )
    const preArrow = detectLambdaPreArrowContext(expressionText);
    if (preArrow) {
      if (preArrow.isWaitingForArrow) {
        return {
          suggestions: [{
            name: '=>',
            insertText: '=> $0',
            isSnippet: true,
            kind: 'operator' as const,
            type: 'object',
            detail: '(Blogger Lambda Arrow)',
            description: 'Mandatory arrow separator between lambda parameter and predicate expression.',
            example: `(${preArrow.paramName} => expression)`,
          }],
          replacementLength: 0,
        };
      }
      if (!preArrow.paramName) {
        const colProp = preArrow.collectionOperand
          ? resolveCollectionProperty(preArrow.collectionOperand, localVariables)
          : undefined;
        const paramName = inferSingularParamName(preArrow.collectionOperand ?? '', colProp);
        return {
          suggestions: [{
            name: paramName,
            insertText: `\${1:${paramName}} => \$0`,
            isSnippet: true,
            kind: 'variable' as const,
            type: 'object',
            detail: `(Lambda Parameter: ${paramName})`,
            description: `Lambda iterator parameter for \`${preArrow.operator}\`.`,
            example: `(${paramName} => ...)`,
          }],
          replacementLength: 0,
        };
      }
    }

    // 3. Bare local variable member navigation (e.g. post.title, item.author.)
    const bareMemberMatch = /(?:^|[^\w:.])([a-z_]\w*(?:\.\w+)*)\.(\w*)$/i.exec(expressionText);
    if (bareMemberMatch && bareMemberMatch[1]) {
      const rawChain = bareMemberMatch[1];
      const typedMember = bareMemberMatch[2] ?? '';
      const segments = rawChain.split('.').filter(Boolean);
      const resolved = this.resolvePropertyFromPath(segments, localVariables);
      if (resolved) {
        const categorized = getCategorizedPropertyMembers(resolved);
        const suggestions: BloggerSuggestion[] = categorized && categorized.length > 0
          ? categorized
              .filter(m => !typedMember || m.property.name.startsWith(typedMember))
              .map(m => ({
                name: m.property.name,
                type: m.property.type,
                description: m.property.description,
                example: `${rawChain}.${m.property.name}`,
                kind: 'property' as const,
                deprecated: m.property.deprecated,
                categoryBadge: m.categoryBadge,
                sortPriority: m.sortPriority,
              }))
          : Object.values(resolved.children ?? {})
              .filter(prop => !typedMember || prop.name.startsWith(typedMember))
              .map(prop => ({
                name: prop.name,
                type: prop.type,
                description: prop.description,
                example: `${rawChain}.${prop.name}`,
                kind: 'property' as const,
                deprecated: prop.deprecated,
                categoryBadge: 'Property',
                sortPriority: 0,
              }));
        if (suggestions.length > 0) {
          return {
            suggestions,
            replacementLength: typedMember.length,
          };
        }
        return undefined;
      }
    }

    // 3.5. Compound parenthesized expression member navigation (e.g. (data:post.body snippet { length: 150 }). )
    const memberExpr = extractPrecedingExpressionForMember(expressionText);
    if (memberExpr) {
      const inferred = inferExpressionType(memberExpr.operand, localVariables);
      const fakeProp: BloggerProperty = {
        name: '',
        type: inferred.type,
        itemChildren: inferred.itemChildren,
      };
      const categorized = getCategorizedPropertyMembers(fakeProp);
      if (categorized && categorized.length > 0) {
        const suggestions: BloggerSuggestion[] = categorized
          .filter(m => !memberExpr.partialMember || m.property.name.startsWith(memberExpr.partialMember))
          .map(m => ({
            name: m.property.name,
            type: m.property.type,
            description: m.property.description,
            example: `(${memberExpr.operand}).${m.property.name}`,
            kind: 'property' as const,
            deprecated: m.property.deprecated,
            categoryBadge: m.categoryBadge,
            sortPriority: m.sortPriority,
          }));
        if (suggestions.length > 0) {
          return {
            suggestions,
            replacementLength: memberExpr.partialMember.length,
          };
        }
      }
    }

    // 4. Infix operator position (<operand> <space> [partialOp])
    const opInfo = extractLeftOperandAtCursor(expressionText);
    if (opInfo) {
      const lambdaScopes = resolveLambdaContextAtCursor(expressionText, expressionText.length, localVariables)?.activeScopes;
      const inferred = inferExpressionType(opInfo.operand, localVariables, lambdaScopes);
      const leftType = inferred.type;
      const allOps = getOperatorSuggestions(leftType, isLoopContext);
      const filtered = opInfo.partialOp
        ? allOps.filter(op => op.name.startsWith(opInfo.partialOp))
        : allOps;
      if (filtered.length > 0) {
        const hasParenSuffix = lineSuffix ? /^\s*\(/.test(lineSuffix) : false;
        const colProp = hasParenSuffix ? undefined : resolveCollectionProperty(opInfo.operand, localVariables, lambdaScopes);
        const paramName = hasParenSuffix ? 'item' : inferSingularParamName(opInfo.operand, colProp);

        const enriched = filtered.map((op) => {
          const isLambda = getSpecCatalog().getOperator(op.name)?.family === 'lambda';
          if (isLambda && !hasParenSuffix) {
            return {
              ...op,
              isSnippet: true,
              insertText: `${op.name} (\${1:${paramName}} => \$0)`,
              detail: '(Blogger Lambda Operator)',
            };
          }
          return op;
        });

        return {
          suggestions: enriched,
          replacementLength: opInfo.partialOp.length,
        };
      }
    }

    // 5. Operand start / Functional operator position
    const operandPos = detectOperandPosition(expressionText);
    if (operandPos.isOperandStart) {
      const typedPrefix = operandPos.typedPrefix;
      const suggestions: BloggerSuggestion[] = [];

      // 1. Data prefix incremental suggestion
      if (!typedPrefix || 'data:'.startsWith(typedPrefix)) {
        suggestions.push({
          name: 'data:',
          type: 'object',
          kind: 'property',
          detail: '(Blogger Data Prefix)',
          description: 'Blogger data expression prefix.',
          example: 'data:blog.title',
          categoryBadge: 'Prefix',
          sortPriority: 0,
        });
      }

      // 2. Scoped template variables (with data: prefix)
      const widgetDict = widgetType && WIDGET_DATA_DICTIONARIES[widgetType] ? WIDGET_DATA_DICTIONARIES[widgetType] : undefined;
      const seenDataProps = new Set<string>();

      if (localVariables) {
        for (const [name, prop] of Object.entries(localVariables)) {
          const isGlobal = Boolean(this.rootTree[name]);
          const isWidget = Boolean(widgetDict && widgetDict[name]);
          if (!isGlobal && !isWidget) {
            const qualifiedName = `data:${name}`;
            seenDataProps.add(name);
            if (!typedPrefix || qualifiedName.startsWith(typedPrefix) || name.startsWith(typedPrefix)) {
              suggestions.push({
                name: qualifiedName,
                type: prop.type,
                description: prop.description ?? `Template variable \`${name}\`.`,
                example: qualifiedName,
                deprecated: prop.deprecated,
                kind: 'variable',
                categoryBadge: 'Local',
                sortPriority: 5,
              });
            }
          }
        }
      }

      // 3. Enclosing widget properties (with data: prefix)
      if (widgetDict) {
        for (const [name, prop] of Object.entries(widgetDict)) {
          seenDataProps.add(name);
          const qualifiedName = `data:${name}`;
          if (!typedPrefix || qualifiedName.startsWith(typedPrefix) || name.startsWith(typedPrefix)) {
            suggestions.push({
              name: qualifiedName,
              type: prop.type,
              description: prop.description,
              example: qualifiedName,
              deprecated: prop.deprecated,
              kind: 'property',
              detail: `(Widget Data: ${widgetType})`,
              categoryBadge: widgetType ? `Widget: ${widgetType}` : 'Widget',
              sortPriority: 10,
            });
          }
        }
      }
      else if (localVariables) {
        // Fallback if widgetType was not explicitly passed in resolver context
        for (const [name, prop] of Object.entries(localVariables)) {
          if (!seenDataProps.has(name) && !this.rootTree[name]) {
            const qualifiedName = `data:${name}`;
            if (!typedPrefix || qualifiedName.startsWith(typedPrefix) || name.startsWith(typedPrefix)) {
              suggestions.push({
                name: qualifiedName,
                type: prop.type,
                description: prop.description,
                example: qualifiedName,
                deprecated: prop.deprecated,
                kind: 'property',
                categoryBadge: 'Widget',
                sortPriority: 10,
              });
            }
          }
        }
      }

      // 4. Global root properties (with data: prefix)
      for (const [name, prop] of Object.entries(this.rootTree)) {
        const qualifiedName = `data:${name}`;
        if (!typedPrefix || qualifiedName.startsWith(typedPrefix) || name.startsWith(typedPrefix)) {
          suggestions.push({
            name: qualifiedName,
            type: prop.type,
            description: prop.description,
            example: qualifiedName,
            deprecated: prop.deprecated,
            kind: 'property',
            detail: `(Blogger Global: ${name})`,
            categoryBadge: 'Global',
            sortPriority: 20,
          });
        }
      }

      // 5. Functional operators and transforms
      const functionalOps = getFunctionalOperatorSuggestions();
      const filteredOps = typedPrefix
        ? functionalOps.filter(k => k.name.startsWith(typedPrefix))
        : functionalOps;
      suggestions.push(...filteredOps);

      // 6. Literals and prefix operators
      const literals: BloggerSuggestion[] = [
        {
          name: 'true',
          type: 'boolean',
          kind: 'enumMember',
          description: 'Boolean literal true.',
          sortPriority: 30,
        },
        {
          name: 'false',
          type: 'boolean',
          kind: 'enumMember',
          description: 'Boolean literal false.',
          sortPriority: 30,
        },
        {
          name: 'null',
          type: 'unknown',
          kind: 'enumMember',
          description: 'Null literal value.',
          sortPriority: 30,
        },
        {
          name: 'not',
          type: 'boolean',
          kind: 'operator',
          detail: '(Prefix Logical Operator)',
          description: 'Logical NOT prefix operator.',
          insertText: 'not ',
          sortPriority: 25,
        },
        {
          name: '!',
          type: 'boolean',
          kind: 'operator',
          detail: '(Prefix Logical Operator)',
          description: 'Logical NOT prefix operator.',
          insertText: '! ',
          sortPriority: 25,
        },
      ];
      const filteredLiterals = typedPrefix
        ? literals.filter(l => l.name.startsWith(typedPrefix))
        : literals;
      suggestions.push(...filteredLiterals);

      if (suggestions.length > 0) {
        return {
          suggestions,
          replacementLength: typedPrefix.length,
        };
      }
    }

    return undefined;
  }

  public resolveFromLinePrefix(
    linePrefix: string,
    options?: BloggerResolverContext,
  ): BloggerResolveResult | undefined {
    const attrMatch = matchAttributeValue(linePrefix);
    if (attrMatch) {
      const { attrName, typedText, beforeAttr } = attrMatch;
      const tagMatch = TAG_CONTEXT_REGEX.exec(beforeAttr)
        || /(?:^|\s)([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr);
      const tagName = tagMatch?.[1];

      if (attrName === 'name') {
        if (tagName === 'b:include') {
          const suggestions: BloggerSuggestion[] = [];
          if (options?.includables?.local) {
            for (const inc of options.includables.local) {
              if (inc.startsWith('super.')) {
                continue;
              }
              suggestions.push({
                name: inc,
                type: 'string',
                kind: 'property',
                detail: '(Includable Subroutine: Local)',
                description: 'Template subroutine defined in current widget or template.',
                example: `<b:include name="${inc}"/>`,
                categoryBadge: 'Local',
                sortPriority: 0,
              });
            }
          }
          if (options?.includables?.defaultMarkups) {
            for (const inc of options.includables.defaultMarkups) {
              if (inc.startsWith('super.')) {
                continue;
              }
              if (!suggestions.some(s => s.name === inc)) {
                suggestions.push({
                  name: inc,
                  type: 'string',
                  kind: 'property',
                  detail: '(Default Markup Subroutine)',
                  description: 'Template subroutine defined in default markup.',
                  example: `<b:include name="${inc}"/>`,
                  categoryBadge: 'Default Markup',
                  sortPriority: 10,
                });
              }
            }
          }
          return {
            suggestions,
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:message') {
          return {
            suggestions: getSystemMessageSuggestions(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:param') {
          return {
            suggestions: getMessageParamSuggestions(options?.enclosingMessageName),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:widget-setting') {
          return {
            suggestions: getWidgetSettingsSuggestions(options?.widgetType),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:tag') {
          return {
            suggestions: getHtmlTagSuggestions(),
            replacementLength: typedText.length,
          };
        }
      }

      if (attrName === 'description') {
        const isSkinTag = tagName === 'Variable' || tagName === 'Group';
        if (isSkinTag) {
          return {
            suggestions: resolveDescriptionsSuggestions(),
            replacementLength: typedText.length,
          };
        }
      }

      if (attrName === 'type') {
        if (tagName === 'Variable') {
          return {
            suggestions: resolveSkinVariableTypesSuggestions(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:widget') {
          return {
            suggestions: resolveWidgetTypesSuggestions(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:defaultmarkup') {
          const lastCommaIndex = typedText.lastIndexOf(',');
          const prefixToReplace = lastCommaIndex >= 0 ? typedText.slice(lastCommaIndex + 1).trimStart() : typedText;

          const definedBefore = lastCommaIndex >= 0
            ? typedText.slice(0, lastCommaIndex).split(',').map(s => s.trim()).filter(s => s.length > 0)
            : [];

          let definedAfter: string[] = [];
          if (options?.lineSuffix) {
            const quoteIdx = options.lineSuffix.search(/["']/);
            const insideQuotes = quoteIdx >= 0 ? options.lineSuffix.slice(0, quoteIdx) : options.lineSuffix;
            const firstComma = insideQuotes.indexOf(',');
            if (firstComma >= 0) {
              definedAfter = insideQuotes.slice(firstComma + 1).split(',').map(s => s.trim()).filter(s => s.length > 0);
            }
          }

          const excludedTypes = [...definedBefore, ...definedAfter];

          return {
            suggestions: resolveDefaultMarkupTypesSuggestions(excludedTypes),
            replacementLength: prefixToReplace.length,
          };
        }
      }

      if (tagName && bloggerTags[tagName]?.attributes?.[attrName]?.values) {
        const values = bloggerTags[tagName].attributes![attrName].values!;
        return {
          suggestions: values.map(val => ({
            name: val,
            type: 'string',
            kind: 'enumMember' as const,
            description: `Value "${val}" for attribute ${attrName}.`,
          })),
          replacementLength: typedText.length,
        };
      }

      if (isExpressionAttribute(attrName, tagName)) {
        const localVariables = resolveLocalVariables(options?.localVariables);
        return this.resolveExpressionContext(
          typedText,
          localVariables,
          attrName === 'values' && tagName === 'b:loop',
          options?.lineSuffix,
          options?.widgetType,
        );
      }
    }

    const tagAttrContext = parseTagAttributeContext(linePrefix);
    if (tagAttrContext) {
      const tagAttrSuggestions = resolveTagAttributeSuggestions(tagAttrContext);
      if (tagAttrSuggestions) {
        return tagAttrSuggestions;
      }
    }

    const localVars = resolveLocalVariables(options?.localVariables);
    const bareExprResult = this.resolveDataOrLambda(linePrefix, localVars, options?.widgetType);
    if (bareExprResult) {
      return bareExprResult;
    }

    const tagMatch = TAG_PREFIX_REGEX.exec(linePrefix);
    if (tagMatch) {
      const bracketPrefix = tagMatch[1];
      const isClosingTag = bracketPrefix === '</';
      const hasOpenBracket = bracketPrefix === '<';
      const typedTag = tagMatch[2] ?? tagMatch[3] ?? '';

      if (isClosingTag) {
        const nearestOpenTag = options?.nearestOpenTag ?? getNearestUnclosedTag(linePrefix);
        if (!nearestOpenTag) {
          return undefined;
        }
        const closingSuggestions = resolveBloggerTagSuggestions(false, true, nearestOpenTag);
        if (closingSuggestions.length === 0) {
          return undefined;
        }
        return {
          suggestions: closingSuggestions,
          replacementLength: typedTag.length,
        };
      }

      return {
        suggestions: resolveBloggerTagSuggestions(hasOpenBracket, false),
        replacementLength: typedTag.length,
      };
    }

    return undefined;
  }

  public resolveHoverAtPosition(
    lineText: string,
    character: number,
    precedingContext?: string | (() => string | undefined),
    options?: BloggerResolverContext,
  ): BloggerHoverResult | undefined {
    return resolveHoverAtPositionDirect(
      lineText,
      character,
      precedingContext,
      options,
    );
  }
}

export function getWidgetSettingsSuggestions(widgetType?: string): readonly BloggerSuggestion[] {
  if (!widgetType) {
    return [];
  }
  const settingsDef = getSpecCatalog().getWidgetSettings(widgetType);
  if (!settingsDef?.canonical) {
    return [];
  }
  return Object.entries(settingsDef.canonical).map(([name, setting]): BloggerSuggestion => ({
    name,
    type: 'string',
    kind: 'property',
    detail: `(${widgetType} Setting)`,
    description: setting.description,
    example: `<b:widget-setting name="${name}">${setting.default ?? ''}</b:widget-setting>`,
  }));
}

export function getSystemMessageSuggestions(): readonly BloggerSuggestion[] {
  const catalog = getSpecCatalog();
  return Object.entries(catalog.getAllMessages()).map(([key, msg]): BloggerSuggestion => {
    const isParam = msg.direct_invocation === false || (msg.parameters && msg.parameters.length > 0);
    const canonicalName = `messages.${key}`;
    return {
      name: canonicalName,
      type: 'string',
      kind: 'property',
      detail: isParam ? '(Parameterized System Message)' : '(System Message)',
      description: isParam
        ? `${msg.description} [Requires <b:param> tags; direct <data:messages...> output is prohibited.]`
        : msg.description,
      insertText: canonicalName,
      isSnippet: false,
      example: isParam
        ? `<b:message name="${canonicalName}">\n  <b:param name="${msg.parameters?.[0]?.name ?? 'param'}" value="..."/>\n</b:message>`
        : `<b:message name="${canonicalName}"/>`,
    };
  });
}

export function getMessageParamSuggestions(messageName?: string): readonly BloggerSuggestion[] {
  if (messageName) {
    const cleanKey = messageName.replace(/^messages\./, '');
    const msg = getSpecCatalog().getMessage(cleanKey);
    if (msg?.parameters && msg.parameters.length > 0) {
      return msg.parameters.map((param, idx): BloggerSuggestion => ({
        name: param.name,
        type: 'string',
        kind: 'property',
        detail: `(Param Pos ${idx + 1} for messages.${cleanKey})`,
        description: `${param.description} Positional replacement order: ${idx + 1}.`,
        example: `<b:param name="${param.name}" value="..."/>`,
      }));
    }
  }

  const defaultParams = [
    { name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' },
    { name: 'authorUrl', position: 2, description: 'Author profile URL placeholder.', exampleValue: 'https://www.blogger.com/profile/...' },
    { name: 'bloggerUrl', position: 1, description: 'Blogger platform URL placeholder.', exampleValue: 'https://www.blogger.com/' },
    { name: 'numComments', position: 1, description: 'Total number of comments placeholder.', exampleValue: '1' },
  ];

  return defaultParams.map((param): BloggerSuggestion => ({
    name: param.name,
    type: 'string',
    kind: 'property',
    detail: '(System Message Parameter)',
    description: param.description,
    example: `<b:param name="${param.name}" value="${param.exampleValue}"/>`,
  }));
}

export const PARAMETERIZED_MESSAGE_KEYS: ReadonlySet<string> = new Set(
  Object.entries(getSpecCatalog().getAllMessages())
    .filter(([_, m]) => m.direct_invocation === false || (m.parameters && m.parameters.length > 0))
    .map(([k]) => k),
);

export interface BloggerOperatorDefinition {
  readonly name: string;
  readonly aliases?: readonly string[] | undefined;
  readonly isCollectionOperator: boolean;
  readonly isLambdaOperator?: boolean | undefined;
  readonly defaultParamName?: string | undefined;
  readonly supportsFunctional: boolean;
  readonly supportsVariadic?: boolean | undefined;
  readonly returnType: BloggerDataType | 'same' | 'element';
  readonly signature: string;
  readonly signatureInfix: string;
  readonly signatureFunctional?: string | undefined;
  readonly functionalSnippet?: string | undefined;
  readonly description: string;
  readonly example: string;
}

const XML_ESCAPED_OPERATORS = new Set(['<', '<=', '>', '>=', '&&', '||', '!']);

const FUNCTIONAL_SNIPPETS: Record<string, string> = {
  'take': 'take(${1:collection}, ${2:count})',
  'limit': 'limit(${1:collection}, ${2:count})',
  'skip': 'skip(${1:collection}, ${2:count})',
  'offset': 'offset(${1:collection}, ${2:count})',
  'in': 'in(${1:item}, ${2:collection})',
  'contains': 'contains(${1:haystack}, ${2:needle})',
  'params': 'params(${1:url}, { ${2:key}: ${3:value} })',
  'appendParams': 'appendParams(${1:url}, { ${2:key}: ${3:value} })',
  'path': 'path(${1:url}, "${2:/path}")',
  'fragment': 'fragment(${1:url}, "${2:sectionId}")',
  'format': 'format(${1:date}, "${2:YYYY-MM-dd}")',
  'resizeImage': 'resizeImage(${1:imageUrl}, ${2:300}, "${3|1:1,4:3,16:9|}")',
  'sourceSet': 'sourceSet(${1:imageUrl}, [${2:200, 400, 800}], "${3|16:9,4:3,1:1|}")',
  'snippet': 'snippet(${1:text}, { length: ${2:150}, links: ${3:false}, linebreaks: ${4:false}, ellipsis: ${5:true} })',
  'and': 'and(${1:condA}, ${2:condB})',
  'or': 'or(${1:condA}, ${2:condB})',
  '==': '==(${1:a}, ${2:b})',
  '!=': '!=(${1:a}, ${2:b})',
  'eq': 'eq(${1:a}, ${2:b})',
  'neq': 'neq(${1:a}, ${2:b})',
  'lt': 'lt(${1:a}, ${2:b})',
  'lte': 'lte(${1:a}, ${2:b})',
  'gt': 'gt(${1:a}, ${2:b})',
  'gte': 'gte(${1:a}, ${2:b})',
  '<': 'lt(${1:a}, ${2:b})',
  '<=': 'lte(${1:a}, ${2:b})',
  '>': 'gt(${1:a}, ${2:b})',
  '>=': 'gte(${1:a}, ${2:b})',
  '?:': '?:(${1:val1}, ${2:val2})',
  '+': '+(${1:a}, ${2:b})',
  '-': '-(${1:a}, ${2:b})',
  '*': '*(${1:a}, ${2:b})',
  '/': '/(${1:a}, ${2:b})',
  '%': '%(${1:a}, ${2:b})',
};

function buildOperatorsCatalog(): Record<string, BloggerOperatorDefinition> {
  const catalog = getSpecCatalog();
  const allOps = catalog.getAllOperators();
  const result: Record<string, BloggerOperatorDefinition> = {};

  const allKeys = new Set(Object.keys(allOps));
  for (const op of Object.values(allOps)) {
    if (op.aliases) {
      for (const a of op.aliases) {
        allKeys.add(a);
      }
    }
  }
  allKeys.add('? :');

  for (const key of allKeys) {
    if (key === 'ne')
      continue;
    const op = catalog.getOperator(key);
    if (!op)
      continue;

    const isLambda = op.family === 'lambda';
    const isCollection = isLambda || op.family === 'collection' || ['in', 'contains', 'take', 'limit', 'skip', 'offset', 'to'].includes(key);
    const returnType = op.return_type_rule === 'self_or_array' ? 'same' : (op.return_type as BloggerDataType);
    const infix = op.syntax.infix ?? key;
    const functional = op.syntax.functional ?? undefined;
    const signature = (infix && functional) ? `${infix} | ${functional}` : (infix ?? functional ?? key);
    const aliasesSet = new Set(op.aliases ?? []);
    const bidirectionalMap: Record<string, string[]> = {
      '<': ['lt'],
      'lt': ['<'],
      '<=': ['lte'],
      'lte': ['<='],
      '>': ['gt'],
      'gt': ['>'],
      '>=': ['gte'],
      'gte': ['>='],
      '==': ['eq'],
      'eq': ['=='],
      '!=': ['neq'],
      'neq': ['!='],
      'filter': ['where'],
      'where': ['filter'],
      'map': ['select'],
      'select': ['map'],
      'take': ['limit'],
      'limit': ['take'],
      'skip': ['offset'],
      'offset': ['skip'],
    };
    if (bidirectionalMap[key]) {
      for (const alias of bidirectionalMap[key]!) {
        aliasesSet.add(alias);
      }
    }
    const aliases = [...aliasesSet];

    result[key] = {
      name: key,
      aliases,
      isCollectionOperator: isCollection,
      isLambdaOperator: isLambda,
      defaultParamName: isLambda ? 'item' : undefined,
      supportsFunctional: op.syntax.supports_functional,
      supportsVariadic: op.syntax.variadic,
      returnType,
      signature,
      signatureInfix: infix,
      signatureFunctional: functional,
      functionalSnippet: FUNCTIONAL_SNIPPETS[key],
      description: op.description,
      example: op.examples?.[0]?.expression ?? infix,
    };
  }

  return result;
}

export const bloggerOperatorsCatalog: Record<string, BloggerOperatorDefinition> = buildOperatorsCatalog();

export function getOperatorSuggestions(
  context?: boolean | BloggerDataType,
  isLoopContext: boolean = false,
): readonly BloggerSuggestion[] {
  let allowedNames: Set<string> | undefined;

  if (typeof context === 'string') {
    allowedNames = new Set(getCompatibleOperatorNames(context, isLoopContext));
  }

  return Object.values(bloggerOperatorsCatalog)
    .filter((op) => {
      if (XML_ESCAPED_OPERATORS.has(op.name)) {
        return false;
      }
      if (allowedNames) {
        return allowedNames.has(op.name) || (op.aliases?.some(alias => allowedNames.has(alias)) ?? false);
      }
      const isCollectionContext = typeof context === 'boolean' ? context : false;
      return !isCollectionContext || op.isCollectionOperator;
    })
    .map((op) => {
      let categoryBadge = 'Operator';
      let sortPriority = 15;
      if (op.isLambdaOperator) {
        categoryBadge = 'Lambda';
        sortPriority = 0;
      }
      else if (['resizeImage', 'sourceSet', 'snippet', 'format', 'params', 'path', 'fragment', 'appendParams'].includes(op.name)) {
        categoryBadge = 'Transform';
        sortPriority = 0;
      }
      else if (op.isCollectionOperator) {
        categoryBadge = 'Collection';
        sortPriority = 5;
      }

      return {
        name: op.name,
        type: (op.returnType === 'same' || op.returnType === 'element') ? 'object' : op.returnType,
        kind: 'operator' as const,
        detail: `(Blogger ${op.isCollectionOperator ? 'Collection ' : ''}Operator)`,
        description: `${op.description}\n\n**Syntax:** \`${op.signatureInfix}\`${op.supportsFunctional ? `\n\n**Functional Syntax:** \`${op.signatureFunctional}\`` : ''}`,
        example: op.example,
        categoryBadge,
        sortPriority,
      };
    });
}

export function getFunctionalOperatorSuggestions(): readonly BloggerSuggestion[] {
  return Object.values(bloggerOperatorsCatalog)
    .filter(op => op.supportsFunctional && op.functionalSnippet && !XML_ESCAPED_OPERATORS.has(op.name))
    .map((op) => {
      const isTransform = ['resizeImage', 'sourceSet', 'snippet', 'format', 'params', 'path', 'fragment', 'appendParams', 'take', 'skip', 'limit', 'offset'].includes(op.name);
      return {
        name: op.name,
        type: (op.returnType === 'same' || op.returnType === 'element') ? 'object' : op.returnType,
        kind: 'operator' as const,
        isSnippet: true,
        insertText: op.functionalSnippet!,
        detail: `(Blogger Operator${op.supportsVariadic ? ', Variadic' : ''})`,
        description: `${op.description}\n\n**Functional Syntax:** \`${op.signatureFunctional}\`\n\n**Infix Syntax:** \`${op.signatureInfix}\``,
        example: op.example,
        categoryBadge: isTransform ? 'Transform' : 'Operator',
        sortPriority: isTransform ? 10 : 20,
      };
    });
}

export const RECOMMENDED_HTML_TAGS = [
  'div',
  'span',
  'article',
  'section',
  'header',
  'footer',
  'aside',
  'nav',
  'main',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'button',
  'a',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'time',
  'img',
  'blockquote',
  'pre',
  'code',
] as const;

export const htmlTagSuggestions: readonly BloggerSuggestion[] = Object.freeze(
  RECOMMENDED_HTML_TAGS.map((tag): BloggerSuggestion => ({
    name: tag,
    type: 'string' as BloggerDataType,
    kind: 'property',
    detail: '(HTML Element — Recommended)',
    description: `Standard HTML element <${tag}>. Note: <b:tag> dynamically generates any valid W3C HTML element.`,
    example: `<b:tag name="${tag}">\n  $0\n</b:tag>`,
  })),
);

export function getHtmlTagSuggestions(): readonly BloggerSuggestion[] {
  return htmlTagSuggestions;
}
