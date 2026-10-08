import type { BloggerDiagnostic } from '../linterTypes.js';
import { scanDirectiveTokens } from '../../parser/directiveScanner.js';
import { isExpressionAttribute } from '../../resolver/pathResolver.js';
import { maskStringLiterals } from '../../utils/textUtils.js';
import { createRange } from '../linterUtils.js';

const UNIVERSAL_WIDGET_PROPERTIES = new Set([
  'id',
  'type',
  'sectionId',
  'instanceId',
  'version',
]);

const GLOBAL_DATA_ROOTS = new Set([
  'blog',
  'view',
  'skin',
  'widgets',
  'messages',
  'template',
  'widget',
]);

const DATA_CALL_REGEX = /\bdata:([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)/g;

function isExprAttr(name: string, tagName: string): boolean {
  return (
    isExpressionAttribute(name, tagName)
    || (name === 'data' && tagName === 'b:include')
    || (name === 'value' && tagName === 'b:attr')
  );
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

  // 3. Check ReportAbuse widget local data scope restrictions
  const tokens = scanDirectiveTokens(maskedText);
  interface ScopeFrame {
    readonly tagName: string;
    readonly isReportAbuseWidget: boolean;
    readonly localVars: Set<string>;
  }
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

      if (lowerTagName.startsWith('data:')) {
        const fullPath = tagName.slice(5);
        const segments = fullPath.split('.');
        const root = segments[0]!;
        const member = segments[1];

        let isValid = false;
        if (root === 'widget') {
          if (member === undefined || UNIVERSAL_WIDGET_PROPERTIES.has(member)) {
            isValid = true;
          }
        }
        else if (GLOBAL_DATA_ROOTS.has(root)) {
          isValid = true;
        }
        else if (inScopeVars.has(root)) {
          isValid = true;
        }

        if (!isValid) {
          const range = createRange(lineOffsets, token.tagStart, token.tagEnd);
          diagnostics.push({
            code: 'blogger.hallucination.data-property',
            message: root === 'widget' && member
              ? `Property "data:widget.${member}" does not exist. Only universal "data:widget.*" properties (${Array.from(UNIVERSAL_WIDGET_PROPERTIES).join(', ')}) are accessible.`
              : `Property "data:${fullPath}" does not exist. Widget "ReportAbuse" has no local data dictionary; only universal "data:widget.*" properties are accessible.`,
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
          const member = segments[1];

          let isValid = false;
          if (root === 'widget') {
            if (member === undefined || UNIVERSAL_WIDGET_PROPERTIES.has(member)) {
              isValid = true;
            }
          }
          else if (GLOBAL_DATA_ROOTS.has(root)) {
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
              message: root === 'widget' && member
                ? `Property "data:widget.${member}" does not exist. Only universal "data:widget.*" properties (id, type, sectionId, instanceId) are accessible.`
                : `Property "${matchedText}" does not exist. Widget "ReportAbuse" has no local data dictionary; only universal "data:widget.*" properties are accessible.`,
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
