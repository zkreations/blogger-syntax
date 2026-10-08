import type { BloggerProperty } from '../models/types.js';
import { messagesProperties, widgetMetaProperties } from '../data/globalData.js';
import { WIDGET_DATA_DICTIONARIES } from '../data/widgetsData.js';
import { maskCommentsAndCdata } from '../utils/textUtils.js';
import {
  inferIncludableVariables,
  inferLoopVariables,
  inferWithVariables,
} from './typeInferencer.js';

export type BloggerScopeTag
  = | 'b:widget'
    | 'b:defaultmarkup'
    | 'b:includable'
    | 'b:with'
    | 'b:loop';

export interface BloggerScopeBlock {
  readonly id: string;
  readonly tag: BloggerScopeTag;
  readonly widgetType?: string | undefined;
  readonly widgetId?: string | undefined;
  readonly includableId?: string | undefined;
  readonly startOffset: number;
  endOffset: number;
  readonly variables: Record<string, BloggerProperty>;
  readonly children: BloggerScopeBlock[];
  readonly parent?: BloggerScopeBlock | undefined;
}

const TAG_REGEX = /<(\/)?b:(widget|defaultmarkup|includable|loop|with)\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;
const INCLUDE_REGEX = /<b:include\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;

const ATTR_REGEX_MAP: Record<string, RegExp> = {
  values: /\bvalues\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  var: /\bvar\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  index: /\bindex\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  value: /\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  type: /\btype\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  id: /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  name: /\bname\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  data: /\bdata\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
};

function extractAttribute(
  attrString: string,
  attrName: 'values' | 'var' | 'index' | 'value' | 'type' | 'id' | 'name' | 'data',
): string | undefined {
  const regex = ATTR_REGEX_MAP[attrName];
  if (!regex) {
    return undefined;
  }
  const match = regex.exec(attrString);
  return match ? (match[1] ?? match[2]) : undefined;
}

function mergeStackVariables(stack: readonly BloggerScopeBlock[]): Record<string, BloggerProperty> {
  const merged: Record<string, BloggerProperty> = {};
  for (const block of stack) {
    Object.assign(merged, block.variables);
  }
  return merged;
}

function findEnclosingWidgetOrMarkup(stack: readonly BloggerScopeBlock[]): BloggerScopeBlock | undefined {
  for (let i = stack.length - 1; i >= 0; i--) {
    const b = stack[i];
    if (b && (b.tag === 'b:widget' || b.tag === 'b:defaultmarkup')) {
      return b;
    }
  }
  return undefined;
}

export class BloggerScopeTracker {
  private readonly documentCache = new Map<string, { version: number; rootBlocks: BloggerScopeBlock[] }>();

  public parseScopes(text: string): BloggerScopeBlock[] {
    const rootBlocks: BloggerScopeBlock[] = [];
    const stack: BloggerScopeBlock[] = [];
    let blockCounter = 0;

    const sanitizedText = maskCommentsAndCdata(text);

    // Pre-pass: Index <b:include name='...' data='...'/> calls across document
    const includeInvocations = new Map<string, string[]>();
    INCLUDE_REGEX.lastIndex = 0;
    while (true) {
      const incMatch = INCLUDE_REGEX.exec(sanitizedText);
      if (incMatch === null) {
        break;
      }
      const attrStr = incMatch[1] ?? '';
      const name = extractAttribute(attrStr, 'name');
      const data = extractAttribute(attrStr, 'data');
      if (name && data) {
        const existing = includeInvocations.get(name) ?? [];
        existing.push(data);
        includeInvocations.set(name, existing);
      }
    }

    TAG_REGEX.lastIndex = 0;

    while (true) {
      const match = TAG_REGEX.exec(sanitizedText);
      if (match === null) {
        break;
      }
      const isClosing = match[1] === '/';
      const rawTag = match[2]?.toLowerCase() ?? '';
      const fullTag = `b:${rawTag}` as BloggerScopeTag;
      const attrString = match[3] ?? '';
      const isSelfClosing = match[4] === '/' || attrString.trimEnd().endsWith('/');
      const tagStartOffset = match.index;
      const tagEndOffset = tagStartOffset + match[0].length;

      if (isClosing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          const current = stack[i];
          if (current && current.tag === fullTag) {
            current.endOffset = tagStartOffset;
            stack.splice(i, stack.length - i);
            break;
          }
        }
        continue;
      }

      if (isSelfClosing) {
        continue;
      }

      const activeVarsAtOpen = mergeStackVariables(stack);
      let variables: Record<string, BloggerProperty> = {};
      let widgetType: string | undefined;
      let widgetId: string | undefined;
      let includableId: string | undefined;

      if (fullTag === 'b:widget') {
        widgetId = extractAttribute(attrString, 'id');
        widgetType = extractAttribute(attrString, 'type');
        if (widgetType && WIDGET_DATA_DICTIONARIES[widgetType]) {
          Object.assign(variables, WIDGET_DATA_DICTIONARIES[widgetType]);
        }
        variables.widget = {
          name: 'widget',
          type: 'object',
          description: 'Current enclosing widget properties.',
          children: widgetMetaProperties,
        };
      }
      else if (fullTag === 'b:defaultmarkup') {
        const markupType = extractAttribute(attrString, 'type');
        widgetType = markupType;
        if (markupType && WIDGET_DATA_DICTIONARIES[markupType]) {
          Object.assign(variables, WIDGET_DATA_DICTIONARIES[markupType]);
        }
        variables.messages = {
          name: 'messages',
          type: 'object',
          description: 'Localized Blogger UI message dictionary.',
          children: messagesProperties,
        };
        variables.widget = {
          name: 'widget',
          type: 'object',
          description: 'Current enclosing widget properties.',
          children: widgetMetaProperties,
        };
      }
      else if (fullTag === 'b:includable') {
        includableId = extractAttribute(attrString, 'id');
        const varName = extractAttribute(attrString, 'var');
        const enclosingBlock = findEnclosingWidgetOrMarkup(stack);
        const forwardedData = includableId ? includeInvocations.get(includableId) : undefined;
        widgetType = enclosingBlock?.widgetType;
        variables = inferIncludableVariables(
          varName,
          forwardedData,
          activeVarsAtOpen,
          widgetType,
        );
      }
      else if (fullTag === 'b:loop') {
        const values = extractAttribute(attrString, 'values') ?? '';
        const varName = extractAttribute(attrString, 'var');
        const indexName = extractAttribute(attrString, 'index');
        variables = inferLoopVariables(values, varName, indexName, activeVarsAtOpen);
      }
      else if (fullTag === 'b:with') {
        const value = extractAttribute(attrString, 'value') ?? '';
        const varName = extractAttribute(attrString, 'var');
        variables = inferWithVariables(value, varName, activeVarsAtOpen);
      }

      const parent = stack[stack.length - 1];
      const newBlock: BloggerScopeBlock = {
        id: `scope_${++blockCounter}_${rawTag}`,
        tag: fullTag,
        widgetType,
        widgetId,
        includableId,
        startOffset: tagEndOffset,
        endOffset: text.length,
        variables,
        children: [],
        parent,
      };

      if (parent) {
        parent.children.push(newBlock);
      }
      else {
        rootBlocks.push(newBlock);
      }

      stack.push(newBlock);
    }

    return rootBlocks;
  }

  public getScopeBlocks(documentKey: string, version: number, text: string): BloggerScopeBlock[] {
    const cached = this.documentCache.get(documentKey);
    if (cached && cached.version === version) {
      return cached.rootBlocks;
    }

    const rootBlocks = this.parseScopes(text);
    this.documentCache.set(documentKey, { version, rootBlocks });
    return rootBlocks;
  }

  public getInnermostBlockAtOffset(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): BloggerScopeBlock | undefined {
    const rootBlocks = this.getScopeBlocks(documentKey, version, text);
    let match: BloggerScopeBlock | undefined;

    function find(blocks: readonly BloggerScopeBlock[]) {
      for (const block of blocks) {
        if (offset >= block.startOffset && offset <= block.endOffset) {
          match = block;
          if (block.children.length > 0) {
            find(block.children);
          }
        }
      }
    }

    find(rootBlocks);
    return match;
  }

  public getEnclosingWidgetType(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): string | undefined {
    let block = this.getInnermostBlockAtOffset(documentKey, version, text, offset);
    while (block) {
      if (block.widgetType) {
        return block.widgetType;
      }
      block = block.parent;
    }
    return undefined;
  }

  public getAvailableIncludables(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): { local: string[]; defaultMarkups: string[] } {
    const rootBlocks = this.getScopeBlocks(documentKey, version, text);
    const block = this.getInnermostBlockAtOffset(documentKey, version, text, offset);

    let enclosingWidget: BloggerScopeBlock | undefined;
    let curr: BloggerScopeBlock | undefined = block;
    while (curr) {
      if (curr.tag === 'b:widget') {
        enclosingWidget = curr;
        break;
      }
      curr = curr.parent;
    }

    const localSet = new Set<string>();
    const defaultMarkupsSet = new Set<string>();

    if (enclosingWidget) {
      for (const child of enclosingWidget.children) {
        if (child.tag === 'b:includable' && child.includableId) {
          localSet.add(child.includableId);
        }
      }
    }
    else {
      function collectAll(blocks: readonly BloggerScopeBlock[]) {
        for (const b of blocks) {
          if (b.tag === 'b:includable' && b.includableId) {
            localSet.add(b.includableId);
          }
          if (b.children.length > 0) {
            collectAll(b.children);
          }
        }
      }
      collectAll(rootBlocks);
    }

    function collectDefaultMarkups(blocks: readonly BloggerScopeBlock[]) {
      for (const b of blocks) {
        if (b.tag === 'b:defaultmarkup') {
          if (!enclosingWidget || !b.widgetType || b.widgetType === enclosingWidget.widgetType || b.widgetType === 'Common') {
            for (const child of b.children) {
              if (child.tag === 'b:includable' && child.includableId) {
                defaultMarkupsSet.add(child.includableId);
              }
            }
          }
        }
        if (b.children.length > 0) {
          collectDefaultMarkups(b.children);
        }
      }
    }
    collectDefaultMarkups(rootBlocks);

    return {
      local: Array.from(localSet),
      defaultMarkups: Array.from(defaultMarkupsSet),
    };
  }

  public getEnclosingMessageName(text: string, offset: number): string | undefined {
    return extractEnclosingMessageName(text, offset);
  }

  public getActiveScopedVariables(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): {
    localVariables: Record<string, BloggerProperty>;
    widgetVariables: Record<string, BloggerProperty>;
  } {
    const rootBlocks = this.getScopeBlocks(documentKey, version, text);
    const localVariables: Record<string, BloggerProperty> = {};
    const widgetVariables: Record<string, BloggerProperty> = {};

    function traverse(blocks: readonly BloggerScopeBlock[]) {
      for (const block of blocks) {
        if (offset >= block.startOffset && offset <= block.endOffset) {
          if (block.tag === 'b:widget' || block.tag === 'b:defaultmarkup') {
            Object.assign(widgetVariables, block.variables);
          }
          else {
            Object.assign(localVariables, block.variables);
          }
          if (block.children.length > 0) {
            traverse(block.children);
          }
        }
      }
    }

    traverse(rootBlocks);
    return { localVariables, widgetVariables };
  }

  public getActiveVariables(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): Record<string, BloggerProperty> {
    const { localVariables, widgetVariables } = this.getActiveScopedVariables(documentKey, version, text, offset);
    return { ...widgetVariables, ...localVariables };
  }

  public clearCache(documentKey?: string): void {
    if (documentKey) {
      this.documentCache.delete(documentKey);
    }
    else {
      this.documentCache.clear();
    }
  }
}

export function extractEnclosingMessageName(text: string, offset: number): string | undefined {
  const sanitizedText = maskCommentsAndCdata(text.slice(0, offset));
  const tagMsgRegex = /<(\/)?b:message\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;
  const stack: string[] = [];

  for (const match of sanitizedText.matchAll(tagMsgRegex)) {
    const isClosing = match[1] === '/';
    const attrString = match[2] ?? '';
    const isSelfClosing = match[3] === '/' || attrString.trimEnd().endsWith('/');

    if (isClosing) {
      stack.pop();
    }
    else if (!isSelfClosing) {
      const name = extractAttribute(attrString, 'name');
      stack.push(name ?? '');
    }
  }

  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}
