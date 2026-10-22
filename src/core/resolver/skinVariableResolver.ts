import type { BloggerSkinVariableSymbol } from 'blogger-spec/data-path';
import type { BloggerProperty } from '../models/types.js';
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

    let description = symbol.description;
    if (description && rawName !== normalizedName) {
      description = `${description} (Original name: \`${rawName}\`)`;
    }
    else if (!description && rawName !== normalizedName) {
      description = `Theme variable (Original name: \`${rawName}\`).`;
    }

    result[normalizedName] = {
      name: normalizedName,
      type: propType,
      ...(description ? { description } : {}),
      example: `data:skin.vars.${normalizedName}`,
      ...(hasChildren ? { children } : {}),
    };
  }

  return result;
}
