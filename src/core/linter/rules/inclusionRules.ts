import type { BloggerDiagnostic } from '../linterTypes.js';
import { isServerInclusion } from '../../data/serverInclusions.js';
import { findIncludableDefinition } from '../../navigation/definitionResolver.js';
import { createRange } from '../linterUtils.js';

const CONTAINER_OR_INCLUDABLE_TAG_REGEX = /<(\/)?b:(widget|defaultmarkup|includable)\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;
const ATTR_ID_REGEX = /\bid\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TYPE_REGEX = /\btype\s*=\s*(["'])([\s\S]*?)\1/i;
const INCLUDE_TAG_REGEX = /<b:include\b((?:"[^"]*"|'[^']*'|[^"'/>])*)\/?>/gi;
const ATTR_NAME_REGEX = /\bname\s*=\s*(["'])([\s\S]*?)\1/i;

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
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const stack: ContainerScope[] = [];

  CONTAINER_OR_INCLUDABLE_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = CONTAINER_OR_INCLUDABLE_TAG_REGEX.exec(maskedText);
    if (!match) {
      break;
    }

    const isClosing = Boolean(match[1]);
    const tagName = match[2]?.toLowerCase();
    const attrs = match[3] ?? '';
    const isSelfClosing = Boolean(match[4]) || attrs.trimEnd().endsWith('/');
    const tagStart = match.index;

    if (isClosing) {
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
      if (!isSelfClosing) {
        const idMatch = ATTR_ID_REGEX.exec(attrs);
        const typeMatch = ATTR_TYPE_REGEX.exec(attrs);
        const wId = idMatch ? (idMatch[2] ?? '') : undefined;
        const wType = typeMatch ? (typeMatch[2] ?? '') : undefined;
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
      if (!isSelfClosing) {
        const typeMatch = ATTR_TYPE_REGEX.exec(attrs);
        const mType = typeMatch ? (typeMatch[2] ?? '') : 'defaultmarkup';
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

      const idMatch = ATTR_ID_REGEX.exec(attrs);
      if (!idMatch) {
        continue;
      }

      const id = idMatch[2] ?? '';
      if (!id) {
        continue;
      }

      if (currentContainer.seenIncludableIds.has(id)) {
        const idAttrOffset = tagStart + match[0].indexOf(idMatch[0]);
        const quoteChar = idMatch[1] ?? '"';
        const valStart = idAttrOffset + idMatch[0].indexOf(quoteChar) + 1;
        const valEnd = valStart + id.length;
        const range = createRange(lineOffsets, valStart, valEnd);

        diagnostics.push({
          code: 'blogger.duplicate.includable-id',
          message: `Duplicate includable ID "${id}" in ${currentContainer.tag} "${currentContainer.label}". Includable IDs must be unique within the same ${currentContainer.tag}.`,
          severity: 'error',
          range,
        });
      }
      else {
        currentContainer.seenIncludableIds.set(id, tagStart);
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
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  INCLUDE_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = INCLUDE_TAG_REGEX.exec(maskedText);
    if (!match) {
      break;
    }

    const attrs = match[1] ?? '';
    const nameMatch = ATTR_NAME_REGEX.exec(attrs);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[2] ?? '';
    if (!name) {
      continue;
    }

    // 1. Check if it's a known Blogger server-side inclusion or super.* platform call
    if (isServerInclusion(name)) {
      continue;
    }

    // 2. Compute range of name attribute value
    const tagStart = match.index;
    const nameAttrOffset = tagStart + match[0].indexOf(nameMatch[0]);
    const quoteChar = nameMatch[1] ?? '"';
    const valStart = nameAttrOffset + nameMatch[0].indexOf(quoteChar) + 1;
    const valEnd = valStart + name.length;

    // 3. Check if it resolves in the template via definition resolver
    const resolved = findIncludableDefinition(documentText, valStart);
    if (!resolved) {
      const range = createRange(lineOffsets, valStart, valEnd);
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
