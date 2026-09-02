import type { BloggerProperty } from '../models/types.js';
import { inferLoopVariables, inferWithVariables } from './typeInferencer.js';

export interface BloggerScopeBlock {
  readonly id: string;
  readonly tag: 'b:loop' | 'b:with';
  readonly startOffset: number;
  endOffset: number;
  readonly variables: Record<string, BloggerProperty>;
  readonly children: BloggerScopeBlock[];
  readonly parent?: BloggerScopeBlock | undefined;
}

const TAG_REGEX = /<(\/)?b:(loop|with)\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;

const ATTR_REGEX_MAP: Record<string, RegExp> = {
  values: /\bvalues\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  var: /\bvar\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  index: /\bindex\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  value: /\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
};

function extractAttribute(attrString: string, attrName: 'values' | 'var' | 'index' | 'value'): string | undefined {
  const regex = ATTR_REGEX_MAP[attrName];
  if (!regex) {
    return undefined;
  }
  const match = regex.exec(attrString);
  return match ? (match[1] ?? match[2]) : undefined;
}

function maskCommentsAndCdata(text: string): string {
  if (!text.includes('<!--') && !text.includes('<![CDATA[')) {
    return text;
  }
  return text.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
}

function mergeStackVariables(stack: readonly BloggerScopeBlock[]): Record<string, BloggerProperty> {
  const merged: Record<string, BloggerProperty> = {};
  for (const block of stack) {
    Object.assign(merged, block.variables);
  }
  return merged;
}

export class BloggerScopeTracker {
  private readonly documentCache = new Map<string, { version: number; rootBlocks: BloggerScopeBlock[] }>();

  public parseScopes(text: string): BloggerScopeBlock[] {
    const rootBlocks: BloggerScopeBlock[] = [];
    const stack: BloggerScopeBlock[] = [];
    let blockCounter = 0;

    const sanitizedText = maskCommentsAndCdata(text);
    TAG_REGEX.lastIndex = 0;

    while (true) {
      const match = TAG_REGEX.exec(sanitizedText);
      if (match === null) {
        break;
      }
      const isClosing = match[1] === '/';
      const tagName = match[2]?.toLowerCase() as 'loop' | 'with';
      const attrString = match[3] ?? '';
      const isSelfClosing = match[4] === '/' || attrString.trimEnd().endsWith('/');
      const tagStartOffset = match.index;
      const tagEndOffset = tagStartOffset + match[0].length;

      if (isClosing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          const current = stack[i];
          if (current && current.tag === `b:${tagName}`) {
            current.endOffset = tagStartOffset;
            stack.splice(i, stack.length - i);
            break;
          }
        }
        continue;
      }

      if (isSelfClosing) {
        // Self-closing tags do not establish an inner container scope
        continue;
      }

      const activeVarsAtOpen = mergeStackVariables(stack);
      let variables: Record<string, BloggerProperty> = {};

      if (tagName === 'loop') {
        const values = extractAttribute(attrString, 'values') ?? '';
        const varName = extractAttribute(attrString, 'var');
        const indexName = extractAttribute(attrString, 'index');
        variables = inferLoopVariables(values, varName, indexName, activeVarsAtOpen);
      }
      else if (tagName === 'with') {
        const value = extractAttribute(attrString, 'value') ?? '';
        const varName = extractAttribute(attrString, 'var');
        variables = inferWithVariables(value, varName, activeVarsAtOpen);
      }

      const parent = stack[stack.length - 1];
      const newBlock: BloggerScopeBlock = {
        id: `scope_${++blockCounter}_${tagName}`,
        tag: `b:${tagName}`,
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

  private collectVariablesAtOffset(
    blocks: readonly BloggerScopeBlock[],
    offset: number,
    target: Record<string, BloggerProperty>,
  ): void {
    for (const block of blocks) {
      if (offset >= block.startOffset && offset <= block.endOffset) {
        Object.assign(target, block.variables);
        if (block.children.length > 0) {
          this.collectVariablesAtOffset(block.children, offset, target);
        }
      }
    }
  }

  public getActiveVariables(
    documentKey: string,
    version: number,
    text: string,
    offset: number,
  ): Record<string, BloggerProperty> {
    const rootBlocks = this.getScopeBlocks(documentKey, version, text);
    const activeVariables: Record<string, BloggerProperty> = {};
    this.collectVariablesAtOffset(rootBlocks, offset, activeVariables);
    return activeVariables;
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
