/**
 * Determines whether the cursor is positioned directly between empty quotes of a description attribute
 * (e.g. `description=""` or `description=''`).
 *
 * @param lineText The full line text where the cursor is located.
 * @param character The character index of the cursor within the line.
 */
export function isCursorInsideEmptyDescription(lineText: string, character: number): boolean {
  if (character < 0 || character > lineText.length) {
    return false;
  }

  const prefix = lineText.slice(0, character);
  const suffix = lineText.slice(character);

  const match = /\bdescription\s*=\s*(["'])$/.exec(prefix);
  if (!match || !match[1]) {
    return false;
  }

  const quote = match[1];
  return suffix.startsWith(quote);
}
