import type { BloggerDiagnostic, LinterOptions } from './linterTypes.js';
import { computeLineOffsets, maskComments } from './linterUtils.js';
import { checkContextAvailability } from './rules/contextRules.js';
import { checkDeprecations } from './rules/deprecationRules.js';
import { checkHallucinations } from './rules/hallucinationRules.js';
import { checkQuotasAndFormatting } from './rules/quotaRules.js';

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

  const rules = options?.rules;
  const diagnostics: BloggerDiagnostic[] = [];

  if (rules?.deprecations !== false) {
    diagnostics.push(...checkDeprecations(documentText, maskedText, lineOffsets));
  }

  if (rules?.hallucinations !== false) {
    diagnostics.push(...checkHallucinations(documentText, maskedText, lineOffsets));
  }

  if (rules?.quotas !== false) {
    diagnostics.push(...checkQuotasAndFormatting(documentText, maskedText, lineOffsets));
  }

  if (rules?.context !== false) {
    diagnostics.push(...checkContextAvailability(documentText, maskedText, lineOffsets));
  }

  return diagnostics;
}
