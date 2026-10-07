export interface Span {
  start: number;
  end: number;
}

/**
 * Masks XML comments (<!-- ... -->), CDATA blocks (<![CDATA[ ... ]]>),
 * and <b:comment> bodies with whitespace, preserving character offsets and line breaks.
 */
export function maskCommentsAndCdata(text: string): string {
  let masked = text;

  if (masked.includes('<!--')) {
    masked = masked.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\r\n]/g, ' '));
  }

  if (masked.includes('<![CDATA[')) {
    masked = masked.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, match => match.replace(/[^\r\n]/g, ' '));
  }

  if (masked.includes('<b:comment')) {
    masked = masked.replace(/<b:comment\b[^>]*>[\s\S]*?<\/b:comment>/gi, match => match.replace(/[^\r\n]/g, ' '));
  }

  return masked;
}

