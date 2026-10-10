import type { DirectiveToken } from '../../parser/directiveScanner.js';
import type { BloggerDiagnostic } from '../linterTypes.js';
import { isServerInclusion } from '../../data/serverInclusions.js';
import { findIncludableDefinition } from '../../navigation/definitionResolver.js';
import { scanDirectiveTokens } from '../../parser/directiveScanner.js';
import { createRange } from '../linterUtils.js';

interface ContainerScope {
  readonly tag: 'widget' | 'defaultmarkup';
  readonly label: string;
  readonly seenIncludableIds: Map<string, number>;
}

/**
 * Validates that no duplicate <b:includable id="..."> definitions exist
 * within the same <b:widget> or <b:defaultmarkup> block.
 */
export function checkDuplicateIncludables(
  _documentText: string,
  maskedText: string,
  lineOffsets: readonly number[],
  scannedTokens?: readonly DirectiveToken[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const stack: ContainerScope[] = [];
  const tokens = scannedTokens ?? scanDirectiveTokens(maskedText);

  for (const token of tokens) {
    const rawTag = token.tagName.toLowerCase();
    if (!rawTag.startsWith('b:')) {
      continue;
    }
    const tagName = rawTag.slice(2);
    if (tagName !== 'widget' && tagName !== 'defaultmarkup' && tagName !== 'includable') {
      continue;
    }

    if (token.isClosing) {
      if (tagName === 'widget' || tagName === 'defaultmarkup') {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i]?.tag === tagName) {
            stack.splice(i, stack.length - i);
            break;
          }
        }
      }
      continue;
    }

    if (tagName === 'widget') {
      if (!token.isSelfClosing) {
        const wId = token.attributes.id?.value;
        const wType = token.attributes.type?.value;
        const label = wId || wType || 'widget';
        stack.push({
          tag: 'widget',
          label,
          seenIncludableIds: new Map(),
        });
      }
      continue;
    }

    if (tagName === 'defaultmarkup') {
      if (!token.isSelfClosing) {
        const mType = token.attributes.type?.value || 'defaultmarkup';
        stack.push({
          tag: 'defaultmarkup',
          label: mType,
          seenIncludableIds: new Map(),
        });
      }
      continue;
    }

    if (tagName === 'includable') {
      const currentContainer = stack[stack.length - 1];
      if (!currentContainer) {
        continue;
      }

      const idAttr = token.attributes.id;
      if (!idAttr) {
        continue;
      }

      const id = idAttr.value;
      if (!id) {
        continue;
      }

      if (currentContainer.seenIncludableIds.has(id)) {
        const range = createRange(lineOffsets, idAttr.valueStart, idAttr.valueEnd);
        diagnostics.push({
          code: 'blogger.duplicate.includable-id',
          message: `Duplicate includable ID "${id}" in ${currentContainer.tag} "${currentContainer.label}". Includable IDs must be unique within the same ${currentContainer.tag}.`,
          severity: 'error',
          range,
        });
      }
      else {
        currentContainer.seenIncludableIds.set(id, token.tagStart);
      }
    }
  }

  return diagnostics;
}

/**
 * Validates that all <b:include name="..."> calls resolve either
 * to a template <b:includable id="..."> or a recognized Blogger server inclusion.
 */
export function checkUnresolvedInclusions(
  documentText: string,
  maskedText: string,
  lineOffsets: readonly number[],
  scannedTokens?: readonly DirectiveToken[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const tokens = scannedTokens ?? scanDirectiveTokens(maskedText);

  for (const token of tokens) {
    if (token.tagName.toLowerCase() !== 'b:include' || token.isClosing) {
      continue;
    }

    if (token.attributes['expr:name']) {
      continue;
    }

    const nameAttr = token.attributes.name;
    if (!nameAttr) {
      continue;
    }

    const name = nameAttr.value;
    if (!name) {
      continue;
    }

    if (isServerInclusion(name)) {
      continue;
    }

    const resolved = findIncludableDefinition(documentText, nameAttr.valueStart);
    if (!resolved) {
      const range = createRange(lineOffsets, nameAttr.valueStart, nameAttr.valueEnd);
      diagnostics.push({
        code: 'blogger.unresolved.inclusion',
        message: `Unresolved inclusion "${name}". Subroutine is not defined in the template and is not a built-in server inclusion.`,
        severity: 'error',
        range,
      });
    }
  }

  return diagnostics;
}
