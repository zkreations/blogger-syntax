import type { BloggerDiagnostic } from '../linterTypes.js';
import { PARAMETERIZED_MESSAGE_KEYS } from '../../data/messagesCatalog.js';
import { isExpressionAttribute } from '../../resolver/pathResolver.js';
import { createRange, scanXmlTags } from '../linterUtils.js';

interface TagHallucination {
  readonly tag: string;
  readonly suggestion: string;
  readonly message: string;
}

const HALLUCINATED_TAGS: readonly TagHallucination[] = [
  { tag: 'b:for', suggestion: 'b:loop', message: 'Directive <b:for> does not exist in Blogger XML. Use <b:loop>.' },
  { tag: 'b:each', suggestion: 'b:loop', message: 'Directive <b:each> does not exist in Blogger XML. Use <b:loop>.' },
  { tag: 'b:set', suggestion: 'b:with', message: 'Directive <b:set> does not exist in Blogger XML. Use <b:with>.' },
  { tag: 'b:var', suggestion: 'b:with', message: 'Directive <b:var> does not exist in Blogger XML. Use <b:with>.' },
  { tag: 'b:let', suggestion: 'b:with', message: 'Directive <b:let> does not exist in Blogger XML. Use <b:with>.' },
  { tag: 'b:else-if', suggestion: 'b:elseif', message: 'Directive <b:else-if> is invalid in Blogger XML. Use <b:elseif>.' },
  { tag: 'b:elif', suggestion: 'b:elseif', message: 'Directive <b:elif> is invalid in Blogger XML. Use <b:elseif>.' },
  { tag: 'b:choose', suggestion: 'b:switch', message: '<b:choose> is an unsupported XSLT/JSTL construct. Use <b:switch>, <b:case>, and <b:default>.' },
  { tag: 'b:when', suggestion: 'b:case', message: '<b:when> is an unsupported XSLT/JSTL construct. Use <b:case>.' },
  { tag: 'b:otherwise', suggestion: 'b:default', message: '<b:otherwise> is an unsupported XSLT/JSTL construct. Use <b:default>.' },
  { tag: 'b:template', suggestion: 'b:includable', message: 'Directive <b:template> is hallucinated in Blogger XML. Use <b:includable id="...">.' },
  { tag: 'b:macro', suggestion: 'b:includable', message: 'Directive <b:macro> is hallucinated in Blogger XML. Use <b:includable id="...">.' },
  { tag: 'b:function', suggestion: 'b:includable', message: 'Directive <b:function> is hallucinated in Blogger XML. Use <b:includable id="...">.' },
];

const HALLUCINATED_TAGS_MAP = new Map(HALLUCINATED_TAGS.map(t => [t.tag.toLowerCase(), t]));
const ALL_TAGS_SCANNER = /<\/?([a-z_][\w:-]*)/gi;
const ATTR_VALUE_SCANNER = /\b([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g;

const PROHIBITED_CLOSING_TAGS: readonly { tag: string; message: string }[] = [
  { tag: 'b:case', message: '<b:case> is strictly a self-closing branch delimiter (<b:case value="..."/>); closing tag </b:case> does not exist in Blogger.' },
  { tag: 'b:default', message: '<b:default/> is strictly a self-closing branch delimiter; closing tag </b:default> does not exist in Blogger.' },
  { tag: 'b:else', message: '<b:else/> is strictly a self-closing branch delimiter; closing tag </b:else> does not exist in Blogger.' },
  { tag: 'b:elseif', message: '<b:elseif cond="..."/> is strictly a self-closing branch delimiter; closing tag </b:elseif> does not exist in Blogger.' },
  { tag: 'b:include', message: '<b:include> is strictly self-closing (<b:include name="..."/>); closing tag </b:include> does not exist in Blogger.' },
  { tag: 'b:eval', message: '<b:eval> is strictly self-closing (<b:eval expr="..."/>); closing tag </b:eval> does not exist in Blogger.' },
  { tag: 'b:attr', message: '<b:attr> is strictly self-closing (<b:attr name="..." value="..."/>); closing tag </b:attr> does not exist in Blogger.' },
  { tag: 'b:class', message: '<b:class> is strictly self-closing (<b:class name="..."/>); closing tag </b:class> does not exist in Blogger.' },
  { tag: 'b:param', message: '<b:param> is strictly self-closing (<b:param name="..." value="..."/>); closing tag </b:param> does not exist in Blogger.' },
  { tag: 'b:template-script', message: '<b:template-script> is strictly self-closing (<b:template-script name="..."/>); closing tag </b:template-script> does not exist in Blogger.' },
];

const PROHIBITED_CLOSING_MAP = new Map(PROHIBITED_CLOSING_TAGS.map(t => [t.tag.toLowerCase(), t]));

export function checkHallucinations(
  _text: string,
  maskedText: string,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  // 1. Detect hallucinated tags and prohibited closing tags
  for (const match of maskedText.matchAll(ALL_TAGS_SCANNER)) {
    const rawTag = match[1];
    if (!rawTag) {
      continue;
    }
    const lowerTag = rawTag.toLowerCase();
    const isClosing = match[0].startsWith('</');
    const matchStart = match.index ?? 0;
    const prefixLength = isClosing ? 2 : 1;
    const tagStart = matchStart + prefixLength;
    const tagEnd = tagStart + rawTag.length;
    const range = createRange(lineOffsets, tagStart, tagEnd);

    if (isClosing) {
      const closingRule = PROHIBITED_CLOSING_MAP.get(lowerTag);
      if (closingRule) {
        diagnostics.push({
          code: 'blogger.hallucination.closing-tag',
          message: closingRule.message,
          severity: 'error',
          range,
        });
        continue;
      }
    }

    const config = HALLUCINATED_TAGS_MAP.get(lowerTag);
    if (config) {
      diagnostics.push({
        code: 'blogger.hallucination.tag',
        message: config.message,
        severity: 'error',
        range,
        quickFixes: config.suggestion
          ? [
              {
                title: `Replace with "${config.suggestion}"`,
                newText: config.suggestion,
                range,
                isPreferred: true,
              },
            ]
          : undefined,
      });
    }
  }

  // 2. Scan tags for inverted attributes, missing expr: prefix, and expression errors
  for (const tag of scanXmlTags(maskedText)) {
    const tagName = tag.tagName;
    const tagContent = tag.tagContent;
    const tagContentOffset = tag.tagContentOffset;
    const lowerTagName = tagName.toLowerCase();

    for (const attrMatch of tagContent.matchAll(ATTR_VALUE_SCANNER)) {
      const attrName = attrMatch[1] ?? '';
      const attrVal = attrMatch[3] ?? '';
      const quoteLength = 1;
      const attrMatchOffset = tagContentOffset + (attrMatch.index ?? 0);
      const attrValOffset = attrMatchOffset + attrMatch[0].indexOf(attrMatch[2] ?? '"') + quoteLength;
      const attrNameRange = createRange(lineOffsets, attrMatchOffset, attrMatchOffset + attrName.length);

      // Inverted attributes: <b:switch expr='...'> -> var='...'
      if (lowerTagName === 'b:switch' && attrName === 'expr') {
        diagnostics.push({
          code: 'blogger.syntax.inverted-attribute',
          message: '<b:switch> requires the "var" attribute (e.g. <b:switch var="...">), not "expr".',
          severity: 'error',
          range: attrNameRange,
          quickFixes: [
            {
              title: 'Replace "expr" with "var"',
              newText: 'var',
              range: attrNameRange,
              isPreferred: true,
            },
          ],
        });
      }

      // Inverted attributes: <b:includable name='...'> -> id='...'
      if (lowerTagName === 'b:includable' && attrName === 'name') {
        diagnostics.push({
          code: 'blogger.syntax.inverted-attribute',
          message: '<b:includable> requires the "id" attribute, not "name".',
          severity: 'error',
          range: attrNameRange,
          quickFixes: [
            {
              title: 'Replace "name" with "id"',
              newText: 'id',
              range: attrNameRange,
              isPreferred: true,
            },
          ],
        });
      }

      // Inverted attributes: <b:include id='...'> -> name='...'
      if (lowerTagName === 'b:include' && attrName === 'id') {
        diagnostics.push({
          code: 'blogger.syntax.inverted-attribute',
          message: '<b:include> requires the "name" attribute, not "id".',
          severity: 'error',
          range: attrNameRange,
          quickFixes: [
            {
              title: 'Replace "id" with "name"',
              newText: 'name',
              range: attrNameRange,
              isPreferred: true,
            },
          ],
        });
      }

      // Missing expr: prefix on dynamic attributes
      if (
        (lowerTagName === 'b:tag' && attrName === 'name' && (attrVal.includes('?') || attrVal.includes('data:')))
        || (lowerTagName === 'b:attr' && attrName === 'value' && (attrVal.includes('?') || attrVal.includes('data:')))
        || (lowerTagName === 'b:class' && attrName === 'name' && (attrVal.includes('?') || attrVal.includes('data:')))
      ) {
        const replacementName = `expr:${attrName}`;
        diagnostics.push({
          code: 'blogger.syntax.missing-expr-prefix',
          message: `<${tagName}> with dynamic expression requires "${replacementName}", not "${attrName}".`,
          severity: 'error',
          range: attrNameRange,
          quickFixes: [
            {
              title: `Change to "${replacementName}"`,
              newText: replacementName,
              range: attrNameRange,
              isPreferred: true,
            },
          ],
        });
      }

      if (!isExpressionAttribute(attrName, tagName)) {
        continue;
      }

      // 2a. JS method chaining: .filter(
      for (const jsMatch of attrVal.matchAll(/\.filter\s*\(/g)) {
        const start = attrValOffset + (jsMatch.index ?? 0);
        const end = start + jsMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        diagnostics.push({
          code: 'blogger.hallucination.js-method',
          message: 'Blogger does not support JavaScript ".filter()" method chaining. Use native operator: "operand filter (param => ...)".',
          severity: 'error',
          range,
          quickFixes: [
            {
              title: 'Convert to infix " filter ("',
              newText: ' filter (',
              range,
              isPreferred: true,
            },
          ],
        });
      }

      // 2b. JS method chaining: .map(
      for (const jsMatch of attrVal.matchAll(/\.map\s*\(/g)) {
        const start = attrValOffset + (jsMatch.index ?? 0);
        const end = start + jsMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        diagnostics.push({
          code: 'blogger.hallucination.js-method',
          message: 'Blogger does not support JavaScript ".map()" method chaining. Use native operator: "operand map (param => ...)".',
          severity: 'error',
          range,
          quickFixes: [
            {
              title: 'Convert to infix " map ("',
              newText: ' map (',
              range,
              isPreferred: true,
            },
          ],
        });
      }

      // 2c. JS method chaining: .slice( or .substring(
      for (const jsMatch of attrVal.matchAll(/\.(?:slice|substring|substr|replace|includes|indexOf|push|pop|shift|unshift)\s*\(/g)) {
        const start = attrValOffset + (jsMatch.index ?? 0);
        const end = start + jsMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        diagnostics.push({
          code: 'blogger.hallucination.js-method',
          message: `JavaScript method "${jsMatch[0].slice(1, -1)}()" is not supported in Blogger expressions. Use native operators or helpers.`,
          severity: 'error',
          range,
        });
      }

      // 2d. String case/split operations or unsupported collection operations
      for (const funcMatch of attrVal.matchAll(/\b(?:toUpperCase|toLowerCase|trim|split|sort|orderBy|groupBy|reduce)\s*(?:\(|=?>)/g)) {
        const start = attrValOffset + (funcMatch.index ?? 0);
        const end = start + funcMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        diagnostics.push({
          code: 'blogger.hallucination.unsupported-operation',
          message: `Operation "${funcMatch[0]}" is not supported in Blogger expressions.`,
          severity: 'error',
          range,
        });
      }

      // 2e. Lambda data prefix: => data:foo
      for (const lambdaDataMatch of attrVal.matchAll(/=>\s*(data:[\w.]+)/g)) {
        const fullMatch = lambdaDataMatch[0];
        const dataPrefixStr = lambdaDataMatch[1]!;
        const start = attrValOffset + (lambdaDataMatch.index ?? 0) + fullMatch.indexOf(dataPrefixStr);
        const end = start + 5; // length of 'data:'
        const range = createRange(lineOffsets, start, end);
        diagnostics.push({
          code: 'blogger.hallucination.lambda-data-prefix',
          message: 'Inside lambda predicates (param => ...), access properties directly (e.g. param.title) without "data:" prefix.',
          severity: 'error',
          range,
          quickFixes: [
            {
              title: 'Remove "data:" prefix',
              newText: '',
              range,
              isPreferred: true,
            },
          ],
        });
      }

      // 2f. Strict equality === or !==
      for (const opMatch of attrVal.matchAll(/===|!==/g)) {
        const start = attrValOffset + (opMatch.index ?? 0);
        const end = start + opMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        const isNeg = opMatch[0] === '!==';
        const fixText = isNeg ? '!=' : '==';
        diagnostics.push({
          code: 'blogger.hallucination.js-operator',
          message: `Triple equals "${opMatch[0]}" is invalid in Blogger. Use "${fixText}" (or "${isNeg ? 'neq' : 'eq'}").`,
          severity: 'error',
          range,
          quickFixes: [
            {
              title: `Replace with "${fixText}"`,
              newText: fixText,
              range,
              isPreferred: true,
            },
          ],
        });
      }

      // 2g. Unescaped XML or JS boolean operators: && or ||
      for (const boolMatch of attrVal.matchAll(/&&|\|\|/g)) {
        const start = attrValOffset + (boolMatch.index ?? 0);
        const end = start + boolMatch[0].length;
        const range = createRange(lineOffsets, start, end);
        const isAnd = boolMatch[0] === '&&';
        const fixText = isAnd ? 'and' : 'or';
        diagnostics.push({
          code: 'blogger.hallucination.js-operator',
          message: `Prohibited symbol "${boolMatch[0]}". In Blogger XML attributes, use word operator "${fixText}".`,
          severity: 'error',
          range,
          quickFixes: [
            {
              title: `Replace with "${fixText}"`,
              newText: fixText,
              range,
              isPreferred: true,
            },
          ],
        });
      }

      // 2h. Parameterized message direct reference inside expressions: data:messages.numberOfComments
      for (const msgMatch of attrVal.matchAll(/\bdata:messages\.([\w-]+)\b/g)) {
        const key = msgMatch[1];
        if (key && PARAMETERIZED_MESSAGE_KEYS.has(key)) {
          const start = attrValOffset + (msgMatch.index ?? 0);
          const end = start + msgMatch[0].length;
          const range = createRange(lineOffsets, start, end);
          diagnostics.push({
            code: 'blogger.syntax.parameterized-message-direct-invocation',
            message: `Direct expression reference "data:messages.${key}" is prohibited. Parameterized messages require '<b:message name="messages.${key}"><b:param .../></b:message>'.`,
            severity: 'error',
            range,
          });
        }
      }
    }
  }

  // 3. Detect scalar <data:...> tags containing operators or parameterized messages
  const dataTagScanner = /<data:([\w.:][^>]*)>/gi;
  for (const match of maskedText.matchAll(dataTagScanner)) {
    const rawBody = match[1]?.trim() ?? '';
    const cleanBody = rawBody.endsWith('/') ? rawBody.slice(0, -1).trim() : rawBody;
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;

    if (/\?:|\s+[+\-*/%]\s+|==|!=|<=|>=|<|>|\s+(?:and|or|not)\s+/i.test(cleanBody)) {
      const range = createRange(lineOffsets, matchStart, matchEnd);
      diagnostics.push({
        code: 'blogger.syntax.data-tag-contains-operators',
        message: '<data:...> is strictly for scalar dot-paths; calculated expressions require <b:eval expr="..."/>.',
        severity: 'error',
        range,
      });
    }

    const msgKeyMatch = /^messages\.([\w-]+)/i.exec(cleanBody);
    if (msgKeyMatch && msgKeyMatch[1] && PARAMETERIZED_MESSAGE_KEYS.has(msgKeyMatch[1])) {
      const range = createRange(lineOffsets, matchStart, matchEnd);
      diagnostics.push({
        code: 'blogger.syntax.parameterized-message-direct-invocation',
        message: `Direct tag invocation '<data:messages.${msgKeyMatch[1]}/>' is forbidden. Parameterized messages require '<b:message name="messages.${msgKeyMatch[1]}"><b:param .../></b:message>'.`,
        severity: 'error',
        range,
      });
    }
  }

  return diagnostics;
}
