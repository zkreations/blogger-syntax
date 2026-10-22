import type { BloggerDiagnostic, BloggerQuickFix, TextPosition, TextRange } from './linterTypes.js';
import { offsetToPosition } from './linterUtils.js';

export interface SuppressionDirective {
  readonly type: 'disable-next-line' | 'disable-line' | 'disable' | 'enable';
  readonly rules: ReadonlySet<string> | 'all';
  readonly line: number;
}

const RULE_ALIASES: Record<string, readonly string[]> = {
  BX1025: ['unresolved-data', 'unresolveddata'],
  BX1024: ['deprecations', 'deprecation'],
  BX1037: ['inclusions', 'inclusion'],
  BX1033: ['duplicates', 'duplicate'],
  BX1036: ['duplicates', 'duplicate'],
  BX1022: ['attributes', 'attribute'],
  BX1039: ['attributes', 'attribute'],
  BX1040: ['attributes', 'attribute'],
  BX1042: ['attributes', 'attribute'],
  BX1023: ['structure'],
  BX1034: ['structure'],
  BX1035: ['structure'],
  BX1041: ['structure'],
};

export function normalizeRuleToken(token: string): string {
  return token.trim().toLowerCase();
}

export function matchesRule(targetCode: string, ruleSet: ReadonlySet<string> | 'all'): boolean {
  if (ruleSet === 'all') {
    return true;
  }
  const codeLower = targetCode.toLowerCase();
  if (ruleSet.has(codeLower)) {
    return true;
  }
  const aliases = RULE_ALIASES[targetCode.toUpperCase()] ?? [];
  return aliases.some(alias => ruleSet.has(alias));
}

export function scanSuppressionDirectives(
  text: string,
  lineOffsets: readonly number[],
): SuppressionDirective[] {
  const directives: SuppressionDirective[] = [];
  const regex = /<!--\s*blogger-lint-(disable-next-line|disable-line|disable|enable)\b([\s\S]*?)-->/g;

  for (const match of text.matchAll(regex)) {
    if (match.index === undefined) {
      continue;
    }
    const type = match[1] as SuppressionDirective['type'];
    const rawRules = match[2]?.trim();

    let rules: Set<string> | 'all' = 'all';
    if (rawRules && rawRules.trim().length > 0) {
      const parts = rawRules.split(/[,\s]+/).map(normalizeRuleToken).filter(Boolean);
      if (parts.length > 0) {
        rules = new Set(parts);
      }
    }

    const pos = offsetToPosition(lineOffsets, match.index);
    directives.push({ type, rules, line: pos.line });
  }

  return directives;
}

export function isDiagnosticSuppressed(
  diag: BloggerDiagnostic,
  directives: readonly SuppressionDirective[],
): boolean {
  const diagLine = diag.range.start.line;

  for (const dir of directives) {
    if (dir.type === 'disable-next-line' && dir.line + 1 === diagLine) {
      if (matchesRule(diag.code, dir.rules)) {
        return true;
      }
    }
    if (dir.type === 'disable-line' && dir.line === diagLine) {
      if (matchesRule(diag.code, dir.rules)) {
        return true;
      }
    }
  }

  let isBlockDisabled = false;
  for (const dir of directives) {
    if (dir.type === 'disable' && dir.line <= 10 && matchesRule(diag.code, dir.rules)) {
      isBlockDisabled = true;
    }

    if (dir.line > diagLine) {
      break;
    }

    if (dir.type === 'disable' && matchesRule(diag.code, dir.rules)) {
      isBlockDisabled = true;
    }
    else if (dir.type === 'enable' && matchesRule(diag.code, dir.rules)) {
      isBlockDisabled = false;
    }
  }

  return isBlockDisabled;
}

export function findFileSuppressionInsertPosition(
  text: string,
  lineOffsets: readonly number[],
): { position: TextPosition; needsLeadingNewline: boolean } {
  const htmlMatch = /<html(?:\s[^>]*)?>/i.exec(text);
  if (htmlMatch && htmlMatch.index !== undefined) {
    const endOffset = htmlMatch.index + htmlMatch[0].length;
    const pos = offsetToPosition(lineOffsets, endOffset);
    const targetLine = pos.line + 1;
    if (targetLine < lineOffsets.length) {
      return { position: { line: targetLine, character: 0 }, needsLeadingNewline: false };
    }
    return { position: offsetToPosition(lineOffsets, text.length), needsLeadingNewline: true };
  }

  const doctypeMatch = /<!DOCTYPE(?:\s[^>]*)?>/i.exec(text);
  if (doctypeMatch && doctypeMatch.index !== undefined) {
    const endOffset = doctypeMatch.index + doctypeMatch[0].length;
    const pos = offsetToPosition(lineOffsets, endOffset);
    const targetLine = pos.line + 1;
    if (targetLine < lineOffsets.length) {
      return { position: { line: targetLine, character: 0 }, needsLeadingNewline: false };
    }
    return { position: offsetToPosition(lineOffsets, text.length), needsLeadingNewline: true };
  }

  const xmlMatch = /<\?xml(?:\s[^?]*)?\?>/i.exec(text);
  if (xmlMatch && xmlMatch.index !== undefined) {
    const endOffset = xmlMatch.index + xmlMatch[0].length;
    const pos = offsetToPosition(lineOffsets, endOffset);
    const targetLine = pos.line + 1;
    if (targetLine < lineOffsets.length) {
      return { position: { line: targetLine, character: 0 }, needsLeadingNewline: false };
    }
    return { position: offsetToPosition(lineOffsets, text.length), needsLeadingNewline: true };
  }

  return { position: { line: 0, character: 0 }, needsLeadingNewline: false };
}

export function buildSuppressionQuickFixes(
  diag: BloggerDiagnostic,
  lineOffsets: readonly number[],
  documentText: string,
): BloggerQuickFix[] {
  const diagLine = diag.range.start.line;
  const lineStart = lineOffsets[diagLine] ?? 0;
  const nextLineStart = lineOffsets[diagLine + 1] ?? documentText.length;
  const currentLineText = documentText.slice(lineStart, nextLineStart);

  const indentMatch = /^\s*/.exec(currentLineText);
  const indent = indentMatch ? indentMatch[0] : '';
  const eol = currentLineText.endsWith('\r\n') || documentText.includes('\r\n') ? '\r\n' : '\n';

  const lineInsertRange: TextRange = {
    start: { line: diagLine, character: 0 },
    end: { line: diagLine, character: 0 },
  };

  const fileInsert = findFileSuppressionInsertPosition(documentText, lineOffsets);
  const fileInsertRange: TextRange = {
    start: fileInsert.position,
    end: fileInsert.position,
  };
  const filePrefix = fileInsert.needsLeadingNewline ? eol : '';

  return [
    {
      title: `Disable rule ${diag.code} for this line`,
      newText: `${indent}<!-- blogger-lint-disable-next-line ${diag.code} -->${eol}`,
      range: lineInsertRange,
      isPreferred: false,
    },
    {
      title: `Disable rule ${diag.code} for entire file`,
      newText: `${filePrefix}<!-- blogger-lint-disable ${diag.code} -->${eol}`,
      range: fileInsertRange,
      isPreferred: false,
    },
  ];
}
