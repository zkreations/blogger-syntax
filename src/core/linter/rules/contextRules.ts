import type { BloggerDiagnostic } from '../linterTypes.js';
import { createRange } from '../linterUtils.js';

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

  return diagnostics;
}
