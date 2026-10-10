import type { BloggerDiagnostic, LinterOptions } from './linterTypes.js';
import { scanDirectiveTokens } from '../parser/directiveScanner.js';
import { computeLineOffsets, maskComments } from './linterUtils.js';
import { checkDirectiveAttributes } from './rules/attributeRules.js';
import { checkContextAvailability } from './rules/contextRules.js';
import { checkDeprecations } from './rules/deprecationRules.js';
import { checkHallucinations } from './rules/hallucinationRules.js';
import { checkDuplicateIncludables, checkUnresolvedInclusions } from './rules/inclusionRules.js';
import { checkQuotasAndFormatting } from './rules/quotaRules.js';
import { checkDocumentStructure } from './rules/structureRules.js';

/**
 * Validates a Blogger XML document text against canonical rules,
 * returning a list of diagnostics with exact ranges and optional quick fixes.
 * Fully decoupled from VS Code.
 */
export function lintBloggerDocument(
  documentText: string,
  options?: LinterOptions,
): readonly BloggerDiagnostic[] {
  if (!documentText) {
    return [];
  }

  const lineOffsets = computeLineOffsets(documentText);
  const maskedText = maskComments(documentText);
  const tokens = scanDirectiveTokens(maskedText);

  const rules = options?.rules;
  const diagnostics: BloggerDiagnostic[] = [];

  if (rules?.deprecations !== false) {
    diagnostics.push(...checkDeprecations(documentText, maskedText, lineOffsets, tokens));
  }

  if (rules?.hallucinations !== false) {
    diagnostics.push(...checkHallucinations(documentText, maskedText, lineOffsets));
  }

  if (rules?.quotas !== false) {
    diagnostics.push(...checkQuotasAndFormatting(documentText, maskedText, lineOffsets));
  }

  if (rules?.context !== false) {
    diagnostics.push(...checkContextAvailability(documentText, maskedText, lineOffsets, tokens));
  }

  if (rules?.duplicates !== false) {
    diagnostics.push(...checkDuplicateIncludables(documentText, maskedText, lineOffsets, tokens));
  }

  if (rules?.inclusions !== false) {
    diagnostics.push(...checkUnresolvedInclusions(documentText, maskedText, lineOffsets, tokens));
  }

  if (rules?.attributes !== false) {
    diagnostics.push(...checkDirectiveAttributes(documentText, maskedText, lineOffsets));
  }

  if (rules?.structure !== false) {
    diagnostics.push(...checkDocumentStructure(documentText, maskedText, lineOffsets, tokens));
  }

  return diagnostics;
}

export { tokenizeExpression } from './rules/quotaRules.js';
export type { Token } from './rules/quotaRules.js';
