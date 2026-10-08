import type { BloggerDiagnostic } from '../linterTypes.js';
import { bloggerDefaultMarkupTypes, bloggerWidgetTypes } from '../../data/widgetTypes.js';
import { isExpressionAttribute } from '../../resolver/tagAttributeResolver.js';
import { createRange, scanXmlTags } from '../linterUtils.js';

const WIDGET_TYPES_SET = new Set<string>(bloggerWidgetTypes);
const DEFAULT_MARKUP_TYPES_SET = new Set<string>(bloggerDefaultMarkupTypes);

const VALID_SECTION_TAGS = new Set([
  'div',
  'header',
  'nav',
  'main',
  'aside',
  'footer',
  'section',
  'article',
]);

const VALID_VARIABLE_TYPES = new Set([
  'color',
  'font',
  'length',
  'background',
  'string',
  'url',
  'automatic',
]);

const VARIABLE_TYPE_ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  color: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor', 'red', 'green', 'blue', 'alpha']),
  font: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor', 'family', 'size']),
  length: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor', 'min', 'max']),
  background: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor', 'color']),
  string: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor']),
  url: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor']),
  automatic: new Set(['name', 'description', 'type', 'default', 'value', 'hideeditor']),
};

const STATIC_ONLY_ATTRS: Record<string, ReadonlySet<string>> = {
  'b:section': new Set(['id', 'showaddelement', 'preferred', 'ads']),
  'b:widget': new Set(['id', 'type', 'title', 'locked', 'visible', 'version']),
  'b:includable': new Set(['id', 'var']),
  'b:loop': new Set(['var', 'index', 'reverse']),
  'b:with': new Set(['var']),
  'b:message': new Set(['name']),
  'b:template-script': new Set(['name']),
  'Variable': new Set(['name', 'type', 'default', 'value', 'hideeditor', 'hideEditor']),
  'Group': new Set(['description', 'selector']),
};

const STATIC_BOOLEAN_ATTRS = new Set([
  'showaddelement',
  'locked',
  'visible',
  'preferred',
  'ads',
  'reverse',
  'hideeditor',
]);

const VALID_STATIC_BOOLEAN_VALUES = new Set([
  'true',
  'false',
  'yes',
  'no',
]);

const QUOTED_BOOLEAN_IN_EXPR_REGEX = /(?<=^|\W)(["'])\s*(true|false)\s*\1(?=\W|$)/gi;

interface TagAttributeRequirement {
  readonly required: readonly string[];
  readonly eitherOneOf?: readonly (readonly string[])[];
  readonly validAttributes?: ReadonlySet<string>;
}

const DIRECTIVE_REQUIREMENTS: Record<string, TagAttributeRequirement> = {
  'b:section': {
    required: ['id'],
    validAttributes: new Set([
      'id',
      'class',
      'name',
      'tag',
      'showaddelement',
      'preferred',
      'cond',
      'ads',
      'maxwidgets',
      'growth',
      'mobile',
    ]),
  },
  'b:widget': {
    required: ['id', 'type'],
    validAttributes: new Set([
      'id',
      'type',
      'title',
      'locked',
      'visible',
      'version',
      'cond',
      'mobile',
      'pageType',
    ]),
  },
  'b:includable': {
    required: ['id'],
    validAttributes: new Set(['id', 'var']),
  },
  'b:include': {
    required: [],
    eitherOneOf: [['name', 'expr:name']],
    validAttributes: new Set(['name', 'data', 'cond']),
  },
  'b:loop': {
    required: ['var'],
    eitherOneOf: [['values', 'expr:values']],
    validAttributes: new Set(['values', 'var', 'index', 'reverse']),
  },
  'b:with': {
    required: ['var'],
    eitherOneOf: [['value', 'expr:value']],
    validAttributes: new Set(['value', 'var']),
  },
  'b:if': {
    required: [],
    eitherOneOf: [['cond', 'expr:cond']],
    validAttributes: new Set(['cond']),
  },
  'b:elseif': {
    required: [],
    eitherOneOf: [['cond', 'expr:cond']],
    validAttributes: new Set(['cond']),
  },
  'b:switch': {
    required: [],
    eitherOneOf: [['var', 'expr:var']],
    validAttributes: new Set(['var']),
  },
  'b:case': {
    required: [],
    eitherOneOf: [['value', 'expr:value']],
    validAttributes: new Set(['value']),
  },
  'b:tag': {
    required: [],
    eitherOneOf: [['name', 'expr:name']],
    validAttributes: new Set(['name', 'cond']),
  },
  'b:attr': {
    required: [],
    eitherOneOf: [
      ['name', 'expr:name'],
      ['value', 'expr:value'],
    ],
    validAttributes: new Set(['name', 'value', 'cond']),
  },
  'b:class': {
    required: [],
    eitherOneOf: [['name', 'expr:name']],
    validAttributes: new Set(['name', 'cond']),
  },
  'b:eval': {
    required: ['expr'],
    validAttributes: new Set(['expr']),
  },
  'b:message': {
    required: ['name'],
    validAttributes: new Set(['name']),
  },
  'b:param': {
    required: ['name'],
    eitherOneOf: [['value', 'expr:value']],
    validAttributes: new Set(['name', 'value']),
  },
  'b:defaultmarkup': {
    required: ['type'],
    validAttributes: new Set(['type']),
  },
  'b:widget-setting': {
    required: ['name'],
    validAttributes: new Set(['name']),
  },
  'b:template-script': {
    required: ['name'],
    validAttributes: new Set(['name']),
  },
  'Variable': {
    required: ['name', 'description', 'type', 'default', 'value'],
    validAttributes: new Set([
      'name',
      'description',
      'type',
      'default',
      'value',
      'color',
      'family',
      'size',
      'min',
      'max',
      'hideEditor',
      'hideeditor',
      'red',
      'green',
      'blue',
      'alpha',
    ]),
  },
  'Group': {
    required: ['description'],
    validAttributes: new Set(['description', 'selector']),
  },
};

const ATTR_PARSER_REGEX = /\b([\w:-]+)(?:\s*=\s*(["'])([\s\S]*?)\2|\s*=\s*([^\s>]+))?/g;
const WIDGET_ID_REGEX = /^([A-Z]+)[1-9]\d{0,2}$/i;

interface ParsedAttr {
  readonly rawName: string;
  readonly value: string | undefined;
  readonly quoteChar?: '"' | '\'' | undefined;
  readonly attrStart: number;
  readonly attrEnd: number;
  readonly valStart?: number | undefined;
  readonly valEnd?: number | undefined;
}

export function checkDirectiveAttributes(
  _documentText: string,
  maskedText: string,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  for (const tag of scanXmlTags(maskedText)) {
    const tagName = tag.tagName;
    const tagContent = tag.tagContent;
    const lowerTagName = tagName.toLowerCase();
    const isBloggerTag = lowerTagName.startsWith('b:') || lowerTagName === 'variable' || lowerTagName === 'group';
    const hasDynamicExpr = tagContent.includes('expr:');

    if (!isBloggerTag && !hasDynamicExpr) {
      continue;
    }

    const matchedConfigKey = Object.keys(DIRECTIVE_REQUIREMENTS).find(
      k => k.toLowerCase() === lowerTagName,
    );

    const tagContentOffset = tag.tagContentOffset;
    const parsedAttrs = new Map<string, ParsedAttr>();

    ATTR_PARSER_REGEX.lastIndex = 0;
    while (true) {
      const match = ATTR_PARSER_REGEX.exec(tagContent);
      if (!match) {
        break;
      }
      const rawName = match[1]!;
      const quoteChar = match[2] as '"' | '\'' | undefined;
      const quotedValue = match[3];
      const unquotedValue = match[4];
      const value = quotedValue ?? unquotedValue;

      const attrStart = tagContentOffset + match.index;
      const attrEnd = attrStart + match[0].length;

      let valStart: number | undefined;
      let valEnd: number | undefined;

      if (quoteChar !== undefined && quotedValue !== undefined) {
        valStart = attrStart + match[0].indexOf(quoteChar) + 1;
        valEnd = valStart + quotedValue.length;
      }
      else if (unquotedValue !== undefined) {
        valStart = attrStart + match[0].indexOf(unquotedValue);
        valEnd = valStart + unquotedValue.length;
      }

      parsedAttrs.set(rawName.toLowerCase(), {
        rawName,
        value,
        quoteChar,
        attrStart,
        attrEnd,
        valStart,
        valEnd,
      });
    }

    const tagHeadRange = createRange(lineOffsets, tag.tagStart, tag.tagStart + tagName.length + 1);

    // 1. Validate mandatory attributes
    if (matchedConfigKey) {
      const config = DIRECTIVE_REQUIREMENTS[matchedConfigKey]!;

      for (const req of config.required) {
        if (lowerTagName === 'variable' && req.toLowerCase() === 'default') {
          const typeAttr = parsedAttrs.get('type');
          const typeVal = typeAttr?.value?.trim().toLowerCase();
          if (typeVal === 'string') {
            continue;
          }
        }

        const lowerReq = req.toLowerCase();
        const exprReq = `expr:${lowerReq}`;
        const hasAttr = parsedAttrs.has(lowerReq) || parsedAttrs.has(exprReq);

        if (!hasAttr) {
          diagnostics.push({
            code: 'blogger.missing.attribute',
            message: `<${tagName}> is missing mandatory attribute "${req}".`,
            severity: 'error',
            range: tagHeadRange,
          });
        }
      }

      if (config.eitherOneOf) {
        for (const alternatives of config.eitherOneOf) {
          const hasAny = alternatives.some(alt => parsedAttrs.has(alt.toLowerCase()));
          if (!hasAny) {
            const listStr = alternatives.map(a => `"${a}"`).join(' or ');
            diagnostics.push({
              code: 'blogger.missing.attribute',
              message: `<${tagName}> requires at least one of the attributes: ${listStr}.`,
              severity: 'error',
              range: tagHeadRange,
            });
          }
        }
      }
    }

    // 2. Prohibit expr: on static-only attributes
    const staticAttrs = STATIC_ONLY_ATTRS[matchedConfigKey ?? ''];
    if (staticAttrs) {
      for (const [attrLowerKey, attrInfo] of parsedAttrs) {
        if (attrLowerKey.startsWith('expr:')) {
          const baseName = attrLowerKey.slice(5);
          for (const s of staticAttrs) {
            if (s.toLowerCase() === baseName) {
              const range = createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);
              diagnostics.push({
                code: 'blogger.syntax.invalid-dynamic-attribute',
                message: `Attribute "${attrInfo.rawName}" on <${tagName}> cannot be dynamic. Remove the "expr:" prefix.`,
                severity: 'error',
                range,
              });
              break;
            }
          }
        }
      }
    }

    // 3. Validate empty required/structural attribute values
    for (const [attrLowerKey, attrInfo] of parsedAttrs) {
      const val = attrInfo.value;
      if (val !== undefined && val.trim() === '') {
        const typeAttr = parsedAttrs.get('type');
        const typeVal = typeAttr?.value?.trim().toLowerCase();
        const isStringSkinVariable = lowerTagName === 'variable' && typeVal === 'string';
        const isExempt = (lowerTagName === 'b:widget' && attrLowerKey === 'title')
          || (isStringSkinVariable && (attrLowerKey === 'value' || attrLowerKey === 'default'))
          || (lowerTagName === 'b:attr' && attrLowerKey === 'value');
        if (!isExempt) {
          const valRange = attrInfo.valStart !== undefined && attrInfo.valEnd !== undefined
            ? createRange(lineOffsets, attrInfo.valStart, attrInfo.valEnd)
            : createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);

          const isRequiredAttr = (
            attrLowerKey === 'id'
            || attrLowerKey === 'type'
            || attrLowerKey === 'var'
            || attrLowerKey === 'name'
            || attrLowerKey === 'expr'
            || attrLowerKey === 'cond'
            || attrLowerKey === 'values'
            || attrLowerKey === 'value'
            || attrLowerKey === 'default'
            || attrLowerKey === 'description'
          );

          if (isRequiredAttr) {
            diagnostics.push({
              code: 'blogger.syntax.empty-attribute',
              message: `Attribute "${attrInfo.rawName}" on <${tagName}> cannot be empty.`,
              severity: 'error',
              range: valRange,
            });
          }
        }
      }
    }

    // 4. Special validation for <b:widget>
    if (lowerTagName === 'b:widget') {
      const typeAttr = parsedAttrs.get('type');
      const idAttr = parsedAttrs.get('id');

      let validWidgetType: string | undefined;

      if (typeAttr && typeAttr.value && typeAttr.value.trim() !== '') {
        const typeVal = typeAttr.value.trim();
        if (!WIDGET_TYPES_SET.has(typeVal)) {
          const range = typeAttr.valStart !== undefined && typeAttr.valEnd !== undefined
            ? createRange(lineOffsets, typeAttr.valStart, typeAttr.valEnd)
            : createRange(lineOffsets, typeAttr.attrStart, typeAttr.attrEnd);

          diagnostics.push({
            code: 'blogger.syntax.unknown-widget-type',
            message: `Unknown widget type "${typeVal}". Must be one of the canonical Blogger widget types (e.g. Blog, Header, HTML, Label, PopularPosts).`,
            severity: 'error',
            range,
          });
        }
        else {
          validWidgetType = typeVal;
        }
      }

      if (idAttr && idAttr.value && idAttr.value.trim() !== '') {
        const idVal = idAttr.value.trim();
        const idMatch = WIDGET_ID_REGEX.exec(idVal);
        const range = idAttr.valStart !== undefined && idAttr.valEnd !== undefined
          ? createRange(lineOffsets, idAttr.valStart, idAttr.valEnd)
          : createRange(lineOffsets, idAttr.attrStart, idAttr.attrEnd);

        if (!idMatch) {
          const expectedPrefix = validWidgetType ?? 'WidgetType';
          diagnostics.push({
            code: 'blogger.syntax.invalid-widget-id',
            message: `Widget ID "${idVal}" is invalid. Widget IDs must strictly consist of the widget type followed by an integer from 1 to 999 (e.g. "${expectedPrefix}1").`,
            severity: 'error',
            range,
          });
        }
        else if (validWidgetType) {
          const prefix = idMatch[1]!;
          if (prefix !== validWidgetType) {
            diagnostics.push({
              code: 'blogger.syntax.invalid-widget-id',
              message: `Widget ID "${idVal}" does not match widget type "${validWidgetType}". The ID prefix must exactly match "${validWidgetType}" (e.g. "${validWidgetType}1").`,
              severity: 'error',
              range,
            });
          }
        }
      }

      const versionAttr = parsedAttrs.get('version');
      if (versionAttr && versionAttr.value && !['1', '2'].includes(versionAttr.value.trim())) {
        const range = versionAttr.valStart !== undefined && versionAttr.valEnd !== undefined
          ? createRange(lineOffsets, versionAttr.valStart, versionAttr.valEnd)
          : createRange(lineOffsets, versionAttr.attrStart, versionAttr.attrEnd);

        diagnostics.push({
          code: 'blogger.syntax.invalid-widget-version',
          message: `Widget version "${versionAttr.value}" is invalid. It must be "1" (legacy) or "2" (modern).`,
          severity: 'warning',
          range,
        });
      }
    }

    // 5. Special validation for <b:section>
    if (lowerTagName === 'b:section') {
      const tagAttr = parsedAttrs.get('tag');
      if (tagAttr && tagAttr.value && tagAttr.value.trim() !== '') {
        const tagVal = tagAttr.value.trim().toLowerCase();
        if (!VALID_SECTION_TAGS.has(tagVal)) {
          const range = tagAttr.valStart !== undefined && tagAttr.valEnd !== undefined
            ? createRange(lineOffsets, tagAttr.valStart, tagAttr.valEnd)
            : createRange(lineOffsets, tagAttr.attrStart, tagAttr.attrEnd);

          diagnostics.push({
            code: 'blogger.syntax.invalid-section-tag',
            message: `HTML container tag "${tagAttr.value}" on <b:section> is not a supported semantic container (must be div, header, nav, main, aside, footer, section, or article).`,
            severity: 'warning',
            range,
          });
        }
      }
    }

    // 6. Special validation for <b:defaultmarkup>
    if (lowerTagName === 'b:defaultmarkup') {
      const typeAttr = parsedAttrs.get('type');
      if (typeAttr && typeAttr.value && typeAttr.value.trim() !== '') {
        const rawValue = typeAttr.value;
        const valStart = typeAttr.valStart ?? typeAttr.attrStart;
        const seenTypes = new Set<string>();

        let currentPos = 0;
        const items = rawValue.split(',');

        for (const item of items) {
          const itemTrimmed = item.trim();
          const leadingWs = item.indexOf(itemTrimmed);
          const itemStart = valStart + currentPos + (itemTrimmed.length > 0 ? (leadingWs >= 0 ? leadingWs : 0) : 0);
          const itemEnd = itemStart + (itemTrimmed.length > 0 ? itemTrimmed.length : item.length);
          const tokenRange = createRange(lineOffsets, itemStart, Math.max(itemStart + 1, itemEnd));

          currentPos += item.length + 1;

          if (itemTrimmed === '' || !DEFAULT_MARKUP_TYPES_SET.has(itemTrimmed)) {
            diagnostics.push({
              code: 'blogger.syntax.invalid-defaultmarkup-type',
              message: `Default markup type "${itemTrimmed}" is invalid. Must be "Common", "All", or a canonical widget type.`,
              severity: 'error',
              range: tokenRange,
            });
          }
          else {
            const canonicalKey = itemTrimmed.toLowerCase();
            if (seenTypes.has(canonicalKey)) {
              diagnostics.push({
                code: 'blogger.syntax.duplicate-defaultmarkup-type',
                message: `Duplicate default markup type "${itemTrimmed}". Widget types must not be repeated.`,
                severity: 'error',
                range: tokenRange,
              });
            }
            else {
              seenTypes.add(canonicalKey);
            }
          }
        }
      }
    }

    // 7. Special validation for <Variable>
    if (lowerTagName === 'variable') {
      const typeAttr = parsedAttrs.get('type');
      if (typeAttr && typeAttr.value && typeAttr.value.trim() !== '') {
        const typeVal = typeAttr.value.trim().toLowerCase();
        if (!VALID_VARIABLE_TYPES.has(typeVal)) {
          const range = typeAttr.valStart !== undefined && typeAttr.valEnd !== undefined
            ? createRange(lineOffsets, typeAttr.valStart, typeAttr.valEnd)
            : createRange(lineOffsets, typeAttr.attrStart, typeAttr.attrEnd);

          diagnostics.push({
            code: 'blogger.syntax.invalid-variable-type',
            message: `Variable type "${typeAttr.value}" is invalid. Must be one of: color, font, length, background, string, url.`,
            severity: 'error',
            range,
          });
        }
        else {
          const allowedAttrs = VARIABLE_TYPE_ALLOWED_ATTRS[typeVal];
          if (allowedAttrs) {
            for (const [attrLowerKey, attrInfo] of parsedAttrs) {
              if (!allowedAttrs.has(attrLowerKey)) {
                const range = createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);
                diagnostics.push({
                  code: 'blogger.syntax.invalid-variable-attribute',
                  message: `Attribute "${attrInfo.rawName}" is not valid for <Variable> of type "${typeVal}".`,
                  severity: 'error',
                  range,
                });
              }
            }
          }
        }
      }
    }

    // 8. Static boolean attributes validation
    for (const [attrLowerKey, attrInfo] of parsedAttrs) {
      if (STATIC_BOOLEAN_ATTRS.has(attrLowerKey)) {
        if (attrInfo.quoteChar === undefined) {
          const range = createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);
          diagnostics.push({
            code: 'blogger.syntax.unquoted-attribute',
            message: `Attribute "${attrInfo.rawName}" must be enclosed in quotes in XML.`,
            severity: 'error',
            range,
          });
        }

        const valLower = attrInfo.value?.trim().toLowerCase();
        if (!valLower || !VALID_STATIC_BOOLEAN_VALUES.has(valLower)) {
          const range = attrInfo.valStart !== undefined && attrInfo.valEnd !== undefined
            ? createRange(lineOffsets, attrInfo.valStart, attrInfo.valEnd)
            : createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);

          diagnostics.push({
            code: 'blogger.syntax.invalid-boolean-attribute',
            message: `Attribute "${attrInfo.rawName}" must be a boolean ("true", "false", "yes", or "no").`,
            severity: 'error',
            range,
          });
        }
      }
    }

    // 9. Dynamic expression validation (warn against quoted booleans)
    for (const [attrLowerKey, attrInfo] of parsedAttrs) {
      if (isExpressionAttribute(attrLowerKey, lowerTagName) && attrInfo.value) {
        QUOTED_BOOLEAN_IN_EXPR_REGEX.lastIndex = 0;
        for (const match of attrInfo.value.matchAll(QUOTED_BOOLEAN_IN_EXPR_REGEX)) {
          const matchIndex = match.index ?? 0;
          const matchText = match[0];
          const boolLiteral = match[2]?.toLowerCase() ?? '';

          const start = (attrInfo.valStart ?? attrInfo.attrStart) + matchIndex;
          const end = start + matchText.length;
          const range = createRange(lineOffsets, start, end);

          diagnostics.push({
            code: 'blogger.syntax.quoted-boolean-in-expression',
            message: `Quoted boolean literal "${matchText}" in expression evaluates as truthy. Use unquoted "${boolLiteral}" instead.`,
            severity: 'warning',
            range,
            quickFixes: [
              {
                title: `Replace with unquoted ${boolLiteral}`,
                newText: boolLiteral,
                range,
                isPreferred: true,
              },
            ],
          });
        }
      }
    }

    // 10. Flag unrecognized attributes on known b: directives
    if (matchedConfigKey && lowerTagName.startsWith('b:')) {
      const validSet = DIRECTIVE_REQUIREMENTS[matchedConfigKey]?.validAttributes;
      if (validSet && lowerTagName !== 'b:tag' && lowerTagName !== 'b:attr') {
        for (const [attrLowerKey, attrInfo] of parsedAttrs) {
          if (attrLowerKey === 'xmlns' || attrLowerKey.startsWith('xmlns:')) {
            continue;
          }
          const baseName = attrLowerKey.startsWith('expr:') ? attrLowerKey.slice(5) : attrLowerKey;
          if (!validSet.has(baseName)) {
            const range = createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrEnd);
            let suggestion: string | undefined;
            if (lowerTagName === 'b:loop' && baseName === 'items') {
              suggestion = 'values';
            }

            diagnostics.push({
              code: 'blogger.unrecognized.attribute',
              message: `Attribute "${attrInfo.rawName}" is not recognized on <${tagName}>.`,
              severity: 'warning',
              range,
              quickFixes: suggestion
                ? [
                    {
                      title: `Replace with "${suggestion}"`,
                      newText: suggestion,
                      range: createRange(lineOffsets, attrInfo.attrStart, attrInfo.attrStart + attrInfo.rawName.length),
                      isPreferred: true,
                    },
                  ]
                : undefined,
            });
          }
        }
      }
    }
  }

  return diagnostics;
}
