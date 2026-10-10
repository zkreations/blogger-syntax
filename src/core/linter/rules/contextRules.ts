import type { DirectiveToken } from '../../parser/directiveScanner.js';
import type { BloggerDiagnostic } from '../linterTypes.js';
import { scanDirectiveTokens } from '../../parser/directiveScanner.js';
import { isExpressionAttribute } from '../../resolver/pathResolver.js';
import { maskStringLiterals } from '../../utils/textUtils.js';

import { createRange } from '../linterUtils.js';

const UNIVERSAL_WIDGET_PROPERTIES = new Set([
  'instanceId',
  'sectionId',
  'type',
  'version',
]);

const GLOBAL_DATA_ROOTS = new Set([
  'blog',
  'view',
  'skin',
  'widgets',
  'messages',
  'template',
]);

const DATA_CALL_REGEX = /\bdata:([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)/g;
const WIDGET_DATA_CALL_REGEX = /\bdata:widget\b((?:\.[a-zA-Z_]\w*)+)?/g;

function isExprAttr(name: string, tagName: string): boolean {
  return (
    isExpressionAttribute(name, tagName)
    || (name === 'data' && tagName === 'b:include')
    || (name === 'value' && tagName === 'b:attr')
    || name.startsWith('expr:')
    || name === 'expr'
  );
}

interface ScopeFrame {
  readonly tagName: string;
  readonly isReportAbuseWidget: boolean;
  readonly localVars: Set<string>;
}

type WidgetScopeStatus
  = | { readonly kind: 'valid_includable' }
    | { readonly kind: 'out_of_scope_directive'; readonly container: string }
    | { readonly kind: 'out_of_scope_global'; readonly container: string };

function getWidgetScopeStatus(
  currentTagName: string,
  scopeStack: readonly ScopeFrame[],
): WidgetScopeStatus {
  let includableIndex = -1;
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    if (scopeStack[i]!.tagName === 'b:includable') {
      includableIndex = i;
      break;
    }
  }

  if (includableIndex !== -1) {
    for (let i = includableIndex - 1; i >= 0; i--) {
      const ancestor = scopeStack[i]!.tagName;
      if (ancestor === 'b:widget') {
        return { kind: 'valid_includable' };
      }
      if (ancestor === 'b:defaultmarkup') {
        const hasDefaultMarkups = scopeStack.slice(0, i).some(f => f.tagName === 'b:defaultmarkups');
        if (hasDefaultMarkups) {
          return { kind: 'valid_includable' };
        }
      }
    }
  }

  const lowerCurrent = currentTagName.toLowerCase();
  if (lowerCurrent === 'b:widget' || lowerCurrent === 'b:defaultmarkup') {
    return { kind: 'out_of_scope_directive', container: currentTagName };
  }

  for (let i = scopeStack.length - 1; i >= 0; i--) {
    const frameTag = scopeStack[i]!.tagName;
    if (frameTag === 'b:widget' || frameTag === 'b:defaultmarkup') {
      return { kind: 'out_of_scope_directive', container: frameTag };
    }
  }

  const topContainer = scopeStack[scopeStack.length - 1]?.tagName || 'global';
  return { kind: 'out_of_scope_global', container: topContainer };
}

interface HallucinatedPropertyRule {
  readonly pattern: RegExp;
  readonly code: string;
  readonly message: string;
}

const HALLUCINATED_DATA_PROPERTIES: readonly HallucinatedPropertyRule[] = [
  {
    pattern: /\.(?:hasTitle|isFeatured)\b/g,
    code: 'blogger.hallucination.data-property',
    message: 'Property is not part of the Blogger data model (e.g. hasTitle, isFeatured do not exist).',
  },
  {
    pattern: /\bdata:(?:headerTitle|logoUrl)\b/g,
    code: 'blogger.hallucination.data-property',
    message: 'Property is hallucinated; Header widget uses data:title and data:image.',
  },
  {
    pattern: /\bdata:categories\b/g,
    code: 'blogger.hallucination.data-property',
    message: 'Property "data:categories" is hallucinated; Label widget uses "data:labels".',
  },
  {
    pattern: /\b(?:data:)?comment\.replies\b/g,
    code: 'blogger.hallucination.data-property',
    message: 'Nested "comment.replies" collection is hallucinated; Blogger comments are flat and filtered via (c => c.inReplyTo == comment.id).',
  },
  {
    pattern: /\b(?:data:)?(?:comment|author)\.author\.photo\.url\b|\bauthor\.photo\.url\b/g,
    code: 'blogger.hallucination.data-property',
    message: 'Property "author.photo.url" is hallucinated; use "author.authorPhoto.image" or "authorAvatarSrc".',
  },
];

const PARAMETERIZED_MESSAGES = new Set([
  'authorSaid',
  'authorSaidWithLink',
  'byAuthor',
  'byAuthorLink',
  'numberOfComments',
  'postedByAuthor',
  'postedByAuthorLink',
  'poweredByBloggerLink',
  'templateImagesBy',
  'templateImagesByLink',
]);

const LAMBDA_DATA_PREFIX_REGEX = /=>\s*(data:[\w.]+)/g;
const PARAMETERIZED_MESSAGE_REGEX = /\bdata:messages\.(\w+)\b/g;

export function checkContextAvailability(
  _text: string,
  maskedText: string,
  lineOffsets: readonly number[],
  scannedTokens?: readonly DirectiveToken[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  for (const rule of HALLUCINATED_DATA_PROPERTIES) {
    for (const match of maskedText.matchAll(rule.pattern)) {
      if (match.index === undefined) {
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const range = createRange(lineOffsets, start, end);

      diagnostics.push({
        code: rule.code,
        message: rule.message,
        severity: 'error',
        range,
      });
    }
  }

  // 1. Check prohibited data: prefix inside lambda predicates
  for (const match of maskedText.matchAll(LAMBDA_DATA_PREFIX_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const fullMatch = match[0];
    const dataPart = match[1]!;
    const start = match.index + fullMatch.indexOf(dataPart);
    const end = start + dataPart.length;
    const range = createRange(lineOffsets, start, end);
    const cleanReplacement = dataPart.replace(/^data:/, '');

    diagnostics.push({
      code: 'blogger.syntax.lambda-data-prefix',
      message: `Inside lambda predicates (param => ...), access properties directly without "data:" prefix.`,
      severity: 'warning',
      range,
      quickFixes: [
        {
          title: `Remove "data:" prefix -> "${cleanReplacement}"`,
          newText: cleanReplacement,
          range,
          isPreferred: true,
        },
      ],
    });
  }

  // 2. Check direct invocation of parameterized messages
  for (const match of maskedText.matchAll(PARAMETERIZED_MESSAGE_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const msgKey = match[1]!;
    if (PARAMETERIZED_MESSAGES.has(msgKey)) {
      const start = match.index;
      const end = start + match[0].length;
      const range = createRange(lineOffsets, start, end);

      diagnostics.push({
        code: 'blogger.syntax.parameterized-message-invocation',
        message: `Direct invocation of parameterized message "messages.${msgKey}" is forbidden. Use <b:message name="messages.${msgKey}"><b:param .../></b:message>.`,
        severity: 'error',
        range,
      });
    }
  }

  // 3. Check data:widget scope delimitations & canonical contract and ReportAbuse restrictions
  const tokens = scannedTokens ?? scanDirectiveTokens(maskedText);
  const scopeStack: ScopeFrame[] = [];

  for (const token of tokens) {
    const tagName = token.tagName;
    const lowerTagName = tagName.toLowerCase();

    if (token.isClosing) {
      for (let i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i]!.tagName === lowerTagName) {
          scopeStack.splice(i);
          break;
        }
      }
      continue;
    }

    const isReportAbuse = lowerTagName === 'b:widget'
      && token.attributes.type?.value?.trim().toLowerCase() === 'reportabuse';

    const localVars = new Set<string>();
    if (lowerTagName === 'b:includable' || lowerTagName === 'b:with') {
      const varAttr = token.attributes.var?.value;
      if (varAttr) {
        localVars.add(varAttr.trim());
      }
    }
    else if (lowerTagName === 'b:loop') {
      const varAttr = token.attributes.var?.value;
      if (varAttr) {
        localVars.add(varAttr.trim());
      }
      const indexAttr = token.attributes.index?.value;
      if (indexAttr) {
        localVars.add(indexAttr.trim());
      }
    }

    // 3a. Universal check for data:widget tags (<data:widget.../>)
    if (lowerTagName === 'data:widget' || lowerTagName.startsWith('data:widget.')) {
      const widgetStatus = getWidgetScopeStatus(tagName, scopeStack);
      const tagRange = createRange(lineOffsets, token.tagStart, token.tagEnd);

      if (widgetStatus.kind === 'out_of_scope_directive') {
        diagnostics.push({
          code: 'OUT_OF_SCOPE_DIRECTIVE',
          message: `"${tagName}" is not valid directly within <${widgetStatus.container}> outside <b:includable>. "data:widget" is only accessible within <b:includable> subroutines.`,
          severity: 'error',
          range: tagRange,
        });
      }
      else if (widgetStatus.kind === 'out_of_scope_global') {
        diagnostics.push({
          code: 'OUT_OF_SCOPE_GLOBAL_ACCESS',
          message: `"${tagName}" cannot be accessed in global scope (<${widgetStatus.container}>). It is strictly limited to <b:includable> within <b:widget> or <b:defaultmarkup>.`,
          severity: 'error',
          range: tagRange,
        });
      }
      else if (lowerTagName.startsWith('data:widget.')) {
        const fullPath = tagName.slice(5);
        const segments = fullPath.split('.').slice(1);
        const prop = segments[0]!;
        if (!UNIVERSAL_WIDGET_PROPERTIES.has(prop) || segments.length > 1) {
          diagnostics.push({
            code: 'blogger.hallucination.data-property',
            message: `Property "data:${fullPath}" does not exist. Canonical data:widget properties are: ${Array.from(UNIVERSAL_WIDGET_PROPERTIES).join(', ')}.`,
            severity: 'error',
            range: tagRange,
          });
        }
      }
    }

    // 3b. Universal check for data:widget occurrences in expression attributes
    for (const attr of Object.values(token.attributes)) {
      if (!attr.value || !isExprAttr(attr.name, tagName)) {
        continue;
      }

      const maskedAttrVal = maskStringLiterals(attr.value);
      WIDGET_DATA_CALL_REGEX.lastIndex = 0;

      for (const match of maskedAttrVal.matchAll(WIDGET_DATA_CALL_REGEX)) {
        if (match.index === undefined) {
          continue;
        }

        const matchedText = match[0];
        const propPart = match[1];
        const start = attr.valueStart + match.index;
        const end = start + matchedText.length;
        const range = createRange(lineOffsets, start, end);
        const widgetStatus = getWidgetScopeStatus(tagName, scopeStack);

        if (widgetStatus.kind === 'out_of_scope_directive') {
          diagnostics.push({
            code: 'OUT_OF_SCOPE_DIRECTIVE',
            message: `"${matchedText}" is not valid directly within <${widgetStatus.container}> outside <b:includable>. "data:widget" is only accessible within <b:includable> subroutines.`,
            severity: 'error',
            range,
          });
        }
        else if (widgetStatus.kind === 'out_of_scope_global') {
          diagnostics.push({
            code: 'OUT_OF_SCOPE_GLOBAL_ACCESS',
            message: `"${matchedText}" cannot be accessed in global scope (<${widgetStatus.container}>). It is strictly limited to <b:includable> within <b:widget> or <b:defaultmarkup>.`,
            severity: 'error',
            range,
          });
        }
        else if (propPart !== undefined) {
          const segments = propPart.slice(1).split('.');
          const prop = segments[0]!;
          if (!UNIVERSAL_WIDGET_PROPERTIES.has(prop) || segments.length > 1) {
            diagnostics.push({
              code: 'blogger.hallucination.data-property',
              message: `Property "${matchedText}" does not exist. Canonical data:widget properties are: ${Array.from(UNIVERSAL_WIDGET_PROPERTIES).join(', ')}.`,
              severity: 'error',
              range,
            });
          }
        }
      }
    }

    // 3c. ReportAbuse widget local data scope restrictions
    const insideReportAbuse = isReportAbuse || scopeStack.some(f => f.isReportAbuseWidget);

    if (insideReportAbuse) {
      const inScopeVars = new Set<string>();
      for (const frame of scopeStack) {
        for (const v of frame.localVars) {
          inScopeVars.add(v);
        }
      }
      for (const v of localVars) {
        inScopeVars.add(v);
      }

      if (lowerTagName.startsWith('data:') && !lowerTagName.startsWith('data:widget') && !lowerTagName.startsWith('data:widgets')) {
        const fullPath = tagName.slice(5);
        const segments = fullPath.split('.');
        const root = segments[0]!;

        let isValid = false;
        if (GLOBAL_DATA_ROOTS.has(root)) {
          isValid = true;
        }
        else if (inScopeVars.has(root)) {
          isValid = true;
        }

        if (!isValid) {
          const range = createRange(lineOffsets, token.tagStart, token.tagEnd);
          diagnostics.push({
            code: 'blogger.hallucination.data-property',
            message: `Property "data:${fullPath}" does not exist. Widget "ReportAbuse" has no local data dictionary; only universal "data:widget.*" properties are accessible.`,
            severity: 'error',
            range,
          });
        }
      }

      for (const attr of Object.values(token.attributes)) {
        if (!attr.value || !isExprAttr(attr.name, tagName)) {
          continue;
        }

        const maskedAttrVal = maskStringLiterals(attr.value);
        DATA_CALL_REGEX.lastIndex = 0;

        for (const match of maskedAttrVal.matchAll(DATA_CALL_REGEX)) {
          if (match.index === undefined) {
            continue;
          }

          const matchedText = match[0];
          const fullPath = match[1]!;
          const segments = fullPath.split('.');
          const root = segments[0]!;

          if (root === 'widget') {
            continue;
          }

          let isValid = false;
          if (GLOBAL_DATA_ROOTS.has(root)) {
            isValid = true;
          }
          else if (inScopeVars.has(root)) {
            isValid = true;
          }

          if (!isValid) {
            const start = attr.valueStart + match.index;
            const end = start + matchedText.length;
            const range = createRange(lineOffsets, start, end);

            diagnostics.push({
              code: 'blogger.hallucination.data-property',
              message: `Property "${matchedText}" does not exist. Widget "ReportAbuse" has no local data dictionary; only universal "data:widget.*" properties are accessible.`,
              severity: 'error',
              range,
            });
          }
        }
      }
    }

    if (!token.isSelfClosing) {
      scopeStack.push({
        tagName: lowerTagName,
        isReportAbuseWidget: isReportAbuse,
        localVars,
      });
    }
  }

  return diagnostics;
}
