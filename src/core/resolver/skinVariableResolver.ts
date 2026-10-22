import type { BloggerSkinVariableSymbol } from 'blogger-spec/data-path';
import type { BloggerHoverResult, BloggerProperty, BloggerResolveResult, BloggerSuggestion } from '../models/types.js';
import { toSkinVarIdentifier } from 'blogger-spec/data-path';
import { scanDirectiveTokens } from 'blogger-spec/parser';
import { getSkinTypeModifiers } from 'blogger-spec/type-system';
import { toBloggerDataType } from './specModelAdapter.js';

export function extractSkinVariables(text: string): Record<string, BloggerSkinVariableSymbol> {
  const result: Record<string, BloggerSkinVariableSymbol> = {};
  const tokens = scanDirectiveTokens(text);

  for (const token of tokens) {
    if (token.tagName.toLowerCase() !== 'variable' || token.isClosing) {
      continue;
    }

    const rawName = token.attributes.name?.value;
    if (!rawName || rawName.trim().length === 0) {
      continue;
    }

    const varType = token.attributes.type?.value ?? 'string';
    const description = token.attributes.description?.value;
    const defaultValue = token.attributes.default?.value;
    const value = token.attributes.value?.value;
    const normalizedId = toSkinVarIdentifier(rawName);

    result[normalizedId] = {
      name: rawName,
      type: varType,
      ...(description ? { description } : {}),
      ...(defaultValue ? { default: defaultValue } : {}),
      ...(value ? { value } : {}),
    };
  }

  return result;
}

export function formatSkinVariableDescription(
  symbol: BloggerSkinVariableSymbol,
  includeOriginalName: boolean = false,
): string {
  const parts: string[] = [];

  if (symbol.description) {
    parts.push(symbol.description);
  }

  const rawName = symbol.name;
  if (includeOriginalName && rawName && toSkinVarIdentifier(rawName) !== rawName) {
    parts.push(`*Original name:* \`${rawName}\``);
  }

  const details: string[] = [];
  if (symbol.default !== undefined) {
    details.push(`- **Default:** \`${symbol.default}\``);
  }
  if (symbol.value !== undefined) {
    details.push(`- **Value:** \`${symbol.value}\``);
  }

  if (details.length > 0) {
    parts.push(details.join('\n'));
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : (symbol.name ? `Theme Designer variable \`${symbol.name}\`.` : 'Theme Designer variable.');
}

export function buildSkinVariableProperties(
  skinVars: Record<string, BloggerSkinVariableSymbol>,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};

  for (const [key, symbol] of Object.entries(skinVars)) {
    const rawName = symbol.name ?? key;
    const normalizedName = toSkinVarIdentifier(rawName);
    const varType = symbol.type ?? 'string';
    const modifiers = getSkinTypeModifiers(varType);

    const children: Record<string, BloggerProperty> = {};
    for (const [modName, modDef] of Object.entries(modifiers)) {
      children[modName] = {
        name: modName,
        type: toBloggerDataType(modDef.output_type),
        description: modDef.description,
        example: modDef.example ?? `data:skin.vars.${normalizedName}.${modName}`,
      };
    }

    const hasChildren = Object.keys(children).length > 0;
    const propType = hasChildren ? 'object' : toBloggerDataType(varType);
    const description = formatSkinVariableDescription(symbol, true);

    result[normalizedName] = {
      name: normalizedName,
      type: propType,
      description,
      example: `data:skin.vars.${normalizedName}`,
      ...(hasChildren ? { children } : {}),
    };
  }

  return result;
}

const SKIN_CSS_PAREN_REGEX = /(?:^|[^\w$])\$\(([\w.]*)$/;
const SKIN_CSS_BARE_REGEX = /(?:^|[^\w$])\$([\w.]*)$/;

export function resolveSkinCssVariables(
  linePrefix: string,
  skinSymbols?: Record<string, BloggerSkinVariableSymbol>,
): BloggerResolveResult | undefined {
  if (!skinSymbols || Object.keys(skinSymbols).length === 0) {
    return undefined;
  }

  // 1. Context: $( ...
  const parenMatch = SKIN_CSS_PAREN_REGEX.exec(linePrefix);
  if (parenMatch && parenMatch[1] !== undefined) {
    const typed = parenMatch[1];
    const lastDotIndex = typed.lastIndexOf('.');

    if (lastDotIndex !== -1) {
      const candidateVarName = typed.slice(0, lastDotIndex);
      const modPrefix = typed.slice(lastDotIndex + 1);

      const varSymbol = Object.values(skinSymbols).find(s => (s.name ?? '') === candidateVarName);
      if (varSymbol) {
        const modifiers = getSkinTypeModifiers(varSymbol.type);
        if (Object.keys(modifiers).length > 0) {
          const suggestions: BloggerSuggestion[] = [];
          for (const [modName, modDef] of Object.entries(modifiers)) {
            if (modPrefix === '' || modName.startsWith(modPrefix)) {
              suggestions.push({
                name: modName,
                type: toBloggerDataType(modDef.output_type),
                description: modDef.description,
                example: `$(${candidateVarName}.${modName})`,
                kind: 'property',
                detail: `(Skin Modifier: ${modDef.output_type})`,
                categoryBadge: 'Modifier',
                sortPriority: 0,
              });
            }
          }
          return {
            suggestions,
            replacementLength: modPrefix.length,
          };
        }
      }
    }

    const suggestions: BloggerSuggestion[] = [];
    for (const s of Object.values(skinSymbols)) {
      const rawName = s.name ?? '';
      if (typed === '' || rawName.startsWith(typed)) {
        suggestions.push({
          name: rawName,
          type: toBloggerDataType(s.type),
          description: s.description ?? `Skin variable \`${rawName}\`.`,
          example: `$(${rawName})`,
          kind: 'variable',
          detail: `(Theme Variable: ${s.type})`,
          categoryBadge: 'Theme',
          sortPriority: 0,
        });
      }
    }
    return {
      suggestions,
      replacementLength: typed.length,
    };
  }

  // 2. Context: $ ...
  const bareMatch = SKIN_CSS_BARE_REGEX.exec(linePrefix);
  if (bareMatch && bareMatch[1] !== undefined) {
    const typed = bareMatch[1];
    const suggestions: BloggerSuggestion[] = [];
    for (const s of Object.values(skinSymbols)) {
      const rawName = s.name ?? '';
      if (typed === '' || rawName.startsWith(typed)) {
        const hasDot = rawName.includes('.');
        suggestions.push({
          name: rawName,
          type: toBloggerDataType(s.type),
          description: s.description ?? `Skin variable \`${rawName}\`.`,
          example: hasDot ? `$(${rawName})` : `$${rawName}`,
          insertText: hasDot ? `(${rawName})` : rawName,
          kind: 'variable',
          detail: `(Theme Variable: ${s.type})`,
          categoryBadge: 'Theme',
          sortPriority: 0,
        });
      }
    }
    return {
      suggestions,
      replacementLength: typed.length,
    };
  }

  return undefined;
}

export function resolveSkinCssHover(
  lineText: string,
  character: number,
  skinSymbols?: Record<string, BloggerSkinVariableSymbol>,
): BloggerHoverResult | undefined {
  if (!skinSymbols || Object.keys(skinSymbols).length === 0) {
    return undefined;
  }

  // 1. Check $(varName) or $(varName.modifier)
  for (const match of lineText.matchAll(/\$\(([\w.]+)\)/g)) {
    if (match.index === undefined) {
      continue;
    }
    const fullToken = match[0];
    const innerPath = match[1];
    const tokenStart = match.index;
    const tokenEnd = tokenStart + fullToken.length;

    if (character >= tokenStart && character <= tokenEnd && innerPath) {
      const lastDotIndex = innerPath.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        const candidateVarName = innerPath.slice(0, lastDotIndex);
        const modName = innerPath.slice(lastDotIndex + 1);

        const varSymbol = Object.values(skinSymbols).find(s => (s.name ?? '') === candidateVarName);
        if (varSymbol) {
          const modifiers = getSkinTypeModifiers(varSymbol.type);
          const modDef = modifiers[modName];
          if (modDef) {
            return {
              hover: {
                title: fullToken,
                category: 'variable',
                type: toBloggerDataType(modDef.output_type),
                description: modDef.description,
                example: fullToken,
              },
              range: { start: tokenStart, end: tokenEnd },
            };
          }
        }
      }

      // Exact variable lookup by rawName
      const varSymbol = Object.values(skinSymbols).find(s => (s.name ?? '') === innerPath);
      if (varSymbol) {
        return {
          hover: {
            title: fullToken,
            category: 'variable',
            type: toBloggerDataType(varSymbol.type),
            description: formatSkinVariableDescription(varSymbol, false),
            example: fullToken,
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  // 2. Check bare $varName
  for (const match of lineText.matchAll(/(?<![\w$])\$(\w+)/g)) {
    if (match.index === undefined) {
      continue;
    }
    const fullToken = match[0];
    const varName = match[1];
    const tokenStart = match.index;
    const tokenEnd = tokenStart + fullToken.length;

    if (character >= tokenStart && character <= tokenEnd && varName) {
      const varSymbol = Object.values(skinSymbols).find(s => (s.name ?? '') === varName);
      if (varSymbol) {
        return {
          hover: {
            title: fullToken,
            category: 'variable',
            type: toBloggerDataType(varSymbol.type),
            description: formatSkinVariableDescription(varSymbol, false),
            example: fullToken,
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }
  }

  return undefined;
}
