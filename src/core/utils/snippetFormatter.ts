/**
 * Cleans VS Code snippet placeholders and converts a snippet template into clean, readable code.
 *
 * Examples:
 * - `b:if cond="${1:condition}">\n\t$0\n</b:if>` -> `<b:if cond="condition">\n\t\n</b:if>`
 * - `b:attr name="${1:name}" value="${2:value}"/>$0` -> `<b:attr name="name" value="value"/>`
 * - `Variable description="${1|OptionA,OptionB|}"` -> `<Variable description="OptionA"`
 */
export function cleanSnippetBody(snippetBody: string, ensureOpenTag: boolean = true): string {
  if (!snippetBody) {
    return '';
  }

  let cleaned = snippetBody;

  // 1. Replace choice placeholders: ${1|choice1,choice2,...|} -> choice1
  cleaned = cleaned.replace(/\$\{\d+\|([^,|]+)(?:,[^|]*)?\|\}/g, '$1');

  // 2. Replace placeholders with default values: ${1:defaultValue} -> defaultValue
  // Repeat to handle potential nested placeholders
  let previous = '';
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(/\$\{\d+:([^{}]*)\}/g, '$1');
  }

  // 3. Remove simple tabstops: ${1}, $0, $1, etc.
  cleaned = cleaned.replace(/\$\{\d+\}/g, '');
  cleaned = cleaned.replace(/\$\d+/g, '');

  // 4. Ensure leading '<' if it looks like a tag start but missing '<'
  if (ensureOpenTag) {
    const trimmed = cleaned.trimStart();
    if (!trimmed.startsWith('<') && (trimmed.startsWith('b:') || trimmed.startsWith('Variable') || trimmed.startsWith('Group'))) {
      const leadingWhitespace = cleaned.slice(0, cleaned.length - trimmed.length);
      cleaned = `${leadingWhitespace}<${trimmed}`;
    }
  }

  return cleaned;
}
