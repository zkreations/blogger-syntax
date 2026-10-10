import type { DirectiveToken } from '../../parser/directiveScanner.js';
import type { BloggerDiagnostic } from '../linterTypes.js';
import { scanDirectiveTokens } from '../../parser/directiveScanner.js';
import { createRange } from '../linterUtils.js';

const ATTR_ID_REGEX = /\bid\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TYPE_REGEX = /\btype\s*=\s*(["'])([\s\S]*?)\1/i;

interface StackElement {
  readonly tagName: string;
  readonly lowerTagName: string;
  readonly id?: string | undefined;
  readonly type?: string | undefined;
  readonly start: number;
  readonly end: number;
}

export function checkDocumentStructure(
  documentText: string,
  maskedText: string,
  lineOffsets: readonly number[],
  scannedTokens?: readonly DirectiveToken[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const tokens = scannedTokens ?? scanDirectiveTokens(maskedText);

  // 1. Detect if this document is a full template
  const isFullDocument = (
    /<html\b/i.test(maskedText)
    || /<body\b/i.test(maskedText)
    || /<head\b/i.test(maskedText)
    || /<!DOCTYPE\b/i.test(documentText)
  );

  let skinFound = false;
  let sectionFound = false;
  let headToken: DirectiveToken | undefined;
  let bodyToken: DirectiveToken | undefined;

  const sectionIds = new Map<string, { start: number; end: number }>();
  const widgetIds = new Map<string, { start: number; end: number }>();
  let reportAbuseCount = 0;

  const stack: StackElement[] = [];

  for (const token of tokens) {
    const tagName = token.tagName;
    const lower = tagName.toLowerCase();

    if (lower === 'head' && !token.isClosing) {
      headToken = token;
    }
    else if (lower === 'body' && !token.isClosing) {
      bodyToken = token;
    }
    else if (lower === 'b:skin' && !token.isClosing) {
      skinFound = true;
    }
    else if (lower === 'b:section' && !token.isClosing) {
      sectionFound = true;
    }

    if (token.isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.lowerTagName === lower) {
          stack.splice(i);
          break;
        }
      }
      continue;
    }

    const parent = stack[stack.length - 1];
    const parentLower = parent?.lowerTagName;

    const idVal = token.attributes.id?.value?.trim() ?? ATTR_ID_REGEX.exec(token.rawAttributesText)?.[2]?.trim();
    const typeVal = token.attributes.type?.value?.trim() ?? ATTR_TYPE_REGEX.exec(token.rawAttributesText)?.[2]?.trim();

    const currentRange = createRange(lineOffsets, token.tagStart, token.tagEnd);

    // Global ID uniqueness checks
    if (idVal) {
      if (lower === 'b:section') {
        if (sectionIds.has(idVal)) {
          diagnostics.push({
            code: 'blogger.duplicate.section-id',
            message: `Duplicate section ID "${idVal}". Section IDs must be globally unique across the template.`,
            severity: 'error',
            range: currentRange,
          });
        }
        else {
          sectionIds.set(idVal, { start: token.tagStart, end: token.tagEnd });
        }

        if (widgetIds.has(idVal)) {
          diagnostics.push({
            code: 'blogger.collision.id',
            message: `ID "${idVal}" is used by both a <b:section> and a <b:widget>. Section and widget IDs must not collide.`,
            severity: 'error',
            range: currentRange,
          });
        }
      }
      else if (lower === 'b:widget') {
        if (widgetIds.has(idVal)) {
          diagnostics.push({
            code: 'blogger.duplicate.widget-id',
            message: `Duplicate widget ID "${idVal}". Widget IDs must be globally unique across the template.`,
            severity: 'error',
            range: currentRange,
          });
        }
        else {
          widgetIds.set(idVal, { start: token.tagStart, end: token.tagEnd });
        }

        if (sectionIds.has(idVal)) {
          diagnostics.push({
            code: 'blogger.collision.id',
            message: `ID "${idVal}" is used by both a <b:section> and a <b:widget>. Section and widget IDs must not collide.`,
            severity: 'error',
            range: currentRange,
          });
        }
      }
    }

    if (lower === 'b:widget' && typeVal?.toLowerCase() === 'reportabuse') {
      reportAbuseCount++;
      if (reportAbuseCount > 1) {
        diagnostics.push({
          code: 'blogger.widget.cardinality-exceeded',
          message: 'Only 1 instance of the "ReportAbuse" widget is permitted per template.',
          severity: 'error',
          range: currentRange,
        });
      }
    }

    // Hierarchy & Containment Rules
    if (lower === 'b:section') {
      const inHead = stack.some(s => s.lowerTagName === 'head');
      if (inHead) {
        diagnostics.push({
          code: 'blogger.structure.section-in-head',
          message: `<b:section> cannot be placed inside <head>; layout containers belong in <body>.`,
          severity: 'error',
          range: currentRange,
        });
      }

      if (parentLower === 'b:section') {
        diagnostics.push({
          code: 'blogger.structure.nested-section',
          message: `<b:section> cannot nest inside another <b:section>. Sections must be sibling elements.`,
          severity: 'error',
          range: currentRange,
        });
      }
      else if (parentLower === 'b:widget') {
        diagnostics.push({
          code: 'blogger.structure.nested-section',
          message: `<b:section> cannot nest inside a <b:widget>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (lower === 'b:widget') {
      if (parentLower !== 'b:section') {
        diagnostics.push({
          code: 'blogger.structure.orphan-widget',
          message: `<b:widget> must reside directly inside a <b:section> container.`,
          severity: 'error',
          range: currentRange,
        });
      }
      if (parentLower === 'b:widget') {
        diagnostics.push({
          code: 'blogger.structure.nested-widget',
          message: `<b:widget> cannot nest inside another <b:widget>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (parentLower === 'b:section') {
      if (lower !== 'b:widget') {
        diagnostics.push({
          code: 'blogger.structure.invalid-section-child',
          message: `<b:section> permits only <b:widget> elements as direct children. Direct <${tagName}> markup is forbidden.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (parentLower === 'b:widget') {
      if (lower === 'b:widget-settings' && parent?.type?.toLowerCase() === 'reportabuse') {
        diagnostics.push({
          code: 'blogger.widget.prohibited-settings',
          message: '<b:widget-settings> is prohibited in "ReportAbuse" widget as it does not support XML configuration persistence.',
          severity: 'error',
          range: currentRange,
        });
      }
      else if (lower !== 'b:includable' && lower !== 'b:widget-settings') {
        diagnostics.push({
          code: 'blogger.structure.invalid-widget-child',
          message: `<b:widget> does not permit direct <${tagName}> content outside <b:includable>. Wrap layout markup in <b:includable id='main'>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }

    if (lower === 'group') {
      if (parentLower === 'group') {
        diagnostics.push({
          code: 'blogger.structure.nested-group',
          message: `<Group> cannot nest inside another <Group>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (parentLower === 'group') {
      if (lower !== 'variable') {
        diagnostics.push({
          code: 'blogger.structure.invalid-group-child',
          message: `<Group> permits only <Variable> elements as direct children.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }

    if (lower === 'b:defaultmarkups') {
      if (stack.some(s => s.lowerTagName === 'b:section' || s.lowerTagName === 'b:widget')) {
        diagnostics.push({
          code: 'blogger.structure.invalid-defaultmarkups-parent',
          message: `<b:defaultmarkups> cannot be placed inside <b:section> or <b:widget>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (lower === 'b:defaultmarkup') {
      if (parentLower !== 'b:defaultmarkups') {
        diagnostics.push({
          code: 'blogger.structure.invalid-defaultmarkup-parent',
          message: `<b:defaultmarkup> must reside directly inside <b:defaultmarkups>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (lower === 'b:widget-setting') {
      if (parentLower !== 'b:widget-settings') {
        diagnostics.push({
          code: 'blogger.structure.invalid-setting-parent',
          message: `<b:widget-setting> must reside directly inside <b:widget-settings>.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (lower === 'b:param') {
      if (parentLower !== 'b:message') {
        diagnostics.push({
          code: 'blogger.structure.invalid-param-parent',
          message: `<b:param> must reside directly inside a <b:message> container.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }
    else if (lower === 'variable' || lower === 'group') {
      const inSkin = stack.some(s => s.lowerTagName === 'b:skin');
      if (!inSkin) {
        diagnostics.push({
          code: 'blogger.structure.invalid-skin-child',
          message: `<${tagName}> must reside inside a <b:skin> container.`,
          severity: 'error',
          range: currentRange,
        });
      }
    }

    if (!token.isSelfClosing) {
      stack.push({
        tagName,
        lowerTagName: lower,
        id: idVal,
        type: typeVal,
        start: token.tagStart,
        end: token.tagEnd,
      });
    }
  }

  // 2. Validate full template mandatory invariants
  if (isFullDocument) {
    if (!skinFound) {
      const targetRange = headToken
        ? createRange(lineOffsets, headToken.tagStart, headToken.tagEnd)
        : createRange(lineOffsets, 0, Math.min(50, maskedText.length));

      diagnostics.push({
        code: 'blogger.structure.missing-skin',
        message: 'A Blogger theme must contain a <b:skin> stylesheet block within <head> (e.g. <b:skin><![CDATA[]]></b:skin>).',
        severity: 'error',
        range: targetRange,
      });
    }

    if (!sectionFound) {
      const targetRange = bodyToken
        ? createRange(lineOffsets, bodyToken.tagStart, bodyToken.tagEnd)
        : createRange(lineOffsets, 0, Math.min(50, maskedText.length));

      diagnostics.push({
        code: 'blogger.structure.missing-section',
        message: 'A Blogger theme must contain at least one <b:section> layout container inside <body>.',
        severity: 'error',
        range: targetRange,
      });
    }
  }

  return diagnostics;
}
