import type {
  BloggerHoverResult,
  BloggerProperty,
} from '../models/types.js';
import { bloggerCommonAttributes, bloggerExprPrefixInfo } from '../data/attributesData.js';
import { systemMessagesCatalog } from '../data/messagesCatalog.js';
import { bloggerOperatorsCatalog } from '../data/operatorsData.js';
import { bloggerTags } from '../data/tagsData.js';
import { widgetSettingsCatalog } from '../data/widgetSettingsData.js';
import { resolveLambdaHoverAtPosition } from '../parser/exprParser.js';

export interface BloggerIncludablesInfo {
  readonly local?: readonly string[];
  readonly defaultMarkups?: readonly string[];
}

export type LocalVariablesResolver = Record<string, BloggerProperty> | (() => Record<string, BloggerProperty>);

export interface BloggerResolverContext {
  readonly localVariables?: LocalVariablesResolver | undefined;
  readonly widgetType?: string | undefined;
  readonly includables?: BloggerIncludablesInfo | undefined;
  readonly enclosingMessageName?: string | undefined;
}

const HOVER_DATA_REGEX = /(?:^|[^\w:.])(data:[[\]\w.]*)/g;
const HOVER_TAG_REGEX = /(<\/?)(b:[\w-]+|Variable|Group)/g;
const HOVER_EXPR_REGEX = /\b(expr:[\w-]*)/g;
const HOVER_ATTR_REGEX = /\b([\w-]+)\s*=/g;
const HOVER_ATTR_VAL_REGEX = /\b([\w:-]+)\s*=\s*(["'])([^"']*)\2/g;
const TAG_CONTEXT_REGEX = /<([\w:-]+)(?:\s[^>]*)?$/;

export function normalizeDocUrls(docUrl?: string | readonly string[]): readonly string[] | undefined {
  if (!docUrl) {
    return undefined;
  }
  return typeof docUrl === 'string' ? [docUrl] : docUrl;
}

export function resolveLocalVariables(resolver?: LocalVariablesResolver): Record<string, BloggerProperty> | undefined {
  return typeof resolver === 'function' ? resolver() : resolver;
}

export function resolveHoverCardAtPosition(
  resolveProperty: (segments: readonly string[], localVariables?: Record<string, BloggerProperty>) => BloggerProperty | undefined,
  lineText: string,
  character: number,
  precedingContext?: string | (() => string | undefined),
  options?: BloggerResolverContext,
): BloggerHoverResult | undefined {
  if (character < 0 || character > lineText.length) {
    return undefined;
  }

  for (const match of lineText.matchAll(HOVER_DATA_REGEX)) {
    const token = match[1];
    if (!token || token === 'data:' || match.index === undefined) {
      continue;
    }
    const tokenStart = match.index + (match[0].length - token.length);
    const tokenEnd = tokenStart + token.length;

    if (character >= tokenStart && character <= tokenEnd) {
      const localVariables = resolveLocalVariables(options?.localVariables);
      const rawPath = token.slice('data:'.length);
      const segments = rawPath.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean);
      const resolved = resolveProperty(segments, localVariables);
      if (resolved) {
        return {
          hover: {
            title: token,
            category: 'data',
            type: resolved.type,
            description: resolved.description,
            example: resolved.example ?? token,
            docUrls: normalizeDocUrls(resolved.docUrl),
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  const localVars = resolveLocalVariables(options?.localVariables);
  const lambdaHover = resolveLambdaHoverAtPosition(lineText, character, localVars);
  if (lambdaHover) {
    return {
      hover: {
        title: lambdaHover.title,
        category: lambdaHover.category,
        type: lambdaHover.type,
        description: lambdaHover.description,
        example: lambdaHover.example,
        docUrls: lambdaHover.docUrls,
      },
      range: lambdaHover.range,
    };
  }

  for (const match of lineText.matchAll(/==|!=|\b(?:filter|where|map|select|count|first|any|all|none|take|limit|skip|offset|to|in|contains|format|params|appendParams|path|fragment|and|or|not|eq|neq|lt|lte|gt|gte|snippet|resizeImage|sourceSet)\b/g)) {
    const opName = match[0];
    if (!opName || match.index === undefined) {
      continue;
    }
    const tokenStart = match.index;
    const tokenEnd = tokenStart + opName.length;

    if (character >= tokenStart && character <= tokenEnd) {
      if (tokenStart > 0 && lineText[tokenStart - 1] === '.') {
        continue;
      }
      const op = bloggerOperatorsCatalog[opName];
      if (op) {
        let description = op.description;
        if (op.signatureInfix && op.signatureFunctional) {
          description += `\n\n**Infix Syntax:** \`${op.signatureInfix}\`\n\n**Functional Syntax:** \`${op.signatureFunctional}\``;
        }
        else if (op.signatureInfix) {
          description += `\n\n**Syntax (Infix only):** \`${op.signatureInfix}\``;
        }
        else if (op.signature) {
          description += `\n\n**Syntax:** \`${op.signature}\``;
        }
        if (op.supportsVariadic) {
          description += `\n\n*(Supports variadic chaining with 3+ arguments)*`;
        }

        return {
          hover: {
            title: `Operator: ${op.name}`,
            category: 'operator',
            type: (op.returnType === 'same' || op.returnType === 'element') ? 'object' : op.returnType,
            description,
            example: op.example,
            docUrls: normalizeDocUrls(op.docUrl),
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  for (const match of lineText.matchAll(HOVER_TAG_REGEX)) {
    const fullTagName = match[2];
    if (!fullTagName || match.index === undefined) {
      continue;
    }
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;

    if (character >= tokenStart && character <= tokenEnd) {
      const tagDef = bloggerTags[fullTagName];
      if (tagDef) {
        return {
          hover: {
            title: `<${fullTagName}>`,
            category: 'tag',
            description: tagDef.description,
            example: tagDef.snippetBody,
            docUrls: normalizeDocUrls(tagDef.docUrl),
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  for (const match of lineText.matchAll(HOVER_EXPR_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;

    if (character >= tokenStart && character <= tokenEnd) {
      return {
        hover: {
          title: `${match[0]} (Expression Attribute)`,
          category: 'prefix',
          type: 'attribute-prefix',
          description: bloggerExprPrefixInfo.description,
          docUrls: normalizeDocUrls(bloggerExprPrefixInfo.docUrl),
        },
        range: { start: tokenStart, end: tokenEnd },
      };
    }
  }

  for (const match of lineText.matchAll(HOVER_ATTR_REGEX)) {
    const attrName = match[1];
    if (!attrName || attrName.startsWith('expr:') || match.index === undefined) {
      continue;
    }
    const tokenStart = match.index;
    const tokenEnd = tokenStart + attrName.length;

    if (character >= tokenStart && character <= tokenEnd) {
      const beforeAttr = lineText.slice(0, tokenStart);
      const resolvedContext = typeof precedingContext === 'function' ? precedingContext() : precedingContext;
      const fullContext = resolvedContext ? `${resolvedContext}\n${beforeAttr}` : beforeAttr;
      const tagMatch = TAG_CONTEXT_REGEX.exec(fullContext);
      const tagName = tagMatch?.[1];

      const isBloggerTag = tagName && (tagName.startsWith('b:') || tagName === 'Variable' || tagName === 'Group');
      if (!isBloggerTag) {
        continue;
      }

      const tagDef = tagName ? bloggerTags[tagName] : undefined;
      const tagAttr = tagDef?.attributes?.[attrName];
      const commonAttr = bloggerCommonAttributes[attrName];
      const attrDef = tagAttr ?? commonAttr;
      if (attrDef) {
        const docUrl = tagAttr?.docUrl ?? commonAttr?.docUrl;
        return {
          hover: {
            title: attrName,
            category: 'attribute',
            type: attrDef.type,
            description: attrDef.description,
            docUrls: normalizeDocUrls(docUrl),
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  for (const match of lineText.matchAll(HOVER_ATTR_VAL_REGEX)) {
    const attrName = match[1];
    const val = match[3];
    if (!attrName || !val || match.index === undefined) {
      continue;
    }
    const valStart = match.index + match[0].indexOf(val);
    const valEnd = valStart + val.length;

    if (character >= valStart && character <= valEnd) {
      const beforeAttr = lineText.slice(0, match.index);
      const resolvedContext = typeof precedingContext === 'function' ? precedingContext() : precedingContext;
      const fullContext = resolvedContext ? `${resolvedContext}\n${beforeAttr}` : beforeAttr;
      const tagMatch = TAG_CONTEXT_REGEX.exec(fullContext);
      const tagName = tagMatch?.[1];

      if (tagName === 'b:widget-setting' && attrName === 'name') {
        const widgetType = options?.widgetType;
        let setting = widgetType ? widgetSettingsCatalog[widgetType]?.[val] : undefined;
        if (!setting) {
          for (const dict of Object.values(widgetSettingsCatalog)) {
            if (dict[val]) {
              setting = dict[val];
              break;
            }
          }
        }
        if (setting) {
          return {
            hover: {
              title: `${val} (${widgetType ? `${widgetType} Setting` : 'Widget Setting'})`,
              category: 'setting',
              description: setting.description,
              example: `<b:widget-setting name="${val}">${setting.default ?? ''}</b:widget-setting>`,
              docUrls: ['https://bloggercode.orbiona.com/2018/02/tags-b-widget-settings.html'],
            },
            range: { start: valStart, end: valEnd },
          };
        }
      }

      if (tagName === 'b:message' && attrName === 'name') {
        const cleanKey = val.replace(/^messages\./, '');
        const msg = systemMessagesCatalog[cleanKey];
        if (msg) {
          return {
            hover: {
              title: `${msg.canonicalName} (${msg.isParameterized ? 'Parameterized Message' : 'System Message'})`,
              category: 'message',
              description: msg.isParameterized
                ? `${msg.description} Requires child <b:param> tags; direct <data:messages...> output is prohibited.`
                : msg.description,
              example: msg.isParameterized
                ? `<b:message name="${msg.canonicalName}">\n  <b:param name="${msg.params?.[0]?.name ?? 'param'}" value="..."/>\n</b:message>`
                : `<b:message name="${msg.canonicalName}"/>`,
              docUrls: ['https://bloggercode.orbiona.com/1979/12/Ressource-data-messages.html'],
            },
            range: { start: valStart, end: valEnd },
          };
        }
      }

      if (tagName === 'b:param' && attrName === 'name') {
        const encMsg = options?.enclosingMessageName;
        const cleanKey = encMsg ? encMsg.replace(/^messages\./, '') : undefined;
        const msg = cleanKey ? systemMessagesCatalog[cleanKey] : undefined;
        let param = msg?.params?.find(p => p.name === val);
        if (!param) {
          for (const m of Object.values(systemMessagesCatalog)) {
            const found = m.params?.find(p => p.name === val);
            if (found) {
              param = found;
              break;
            }
          }
        }
        if (param) {
          return {
            hover: {
              title: `${val} (Parameter Pos ${param.position})`,
              category: 'param',
              description: `${param.description} (Positional substitution order: ${param.position}).`,
              example: `<b:param name="${val}" value="${param.exampleValue}"/>`,
              docUrls: ['https://bloggercode.orbiona.com/2018/02/tag-b-message-b-param.html'],
            },
            range: { start: valStart, end: valEnd },
          };
        }
      }
    }
  }

  return undefined;
}
