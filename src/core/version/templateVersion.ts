export type BloggerLayoutVersion = 1 | 2 | 3;

export interface TemplateVersionResult {
  version: BloggerLayoutVersion;
  confidence: 'explicit' | 'inferred';
  detectedFeatures: string[];
  summary: string;
}

const EXPLICIT_ATTR_REGEX = /\bb:(?:layoutsVersion|version)\s*=\s*["']([123])["']/i;

const V3_MARKERS: { name: string; regex: RegExp }[] = [
  { name: 'b:defaultmarkups', regex: /<b:defaultmarkups\b/i },
  { name: 'b:template-script', regex: /<b:template-script\b/i },
  { name: 'b:with', regex: /<b:with\b/i },
  { name: 'semantic b:section tag', regex: /<b:section\s[^>]*\btag\s*=/i },
];

const V1_MARKERS: { name: string; regex: RegExp }[] = [
  { name: 'legacy section attribute (growth)', regex: /<b:section\s[^>]*\bgrowth\s*=/i },
  { name: 'legacy section attribute (maxwidgets)', regex: /<b:section\s[^>]*\bmaxwidgets\s*=/i },
];

export function detectTemplateVersion(text: string): TemplateVersionResult {
  // 1. Check for explicit layout version attribute on <html>
  const attrMatch = EXPLICIT_ATTR_REGEX.exec(text);
  if (attrMatch?.[1]) {
    const v = Number.parseInt(attrMatch[1], 10) as BloggerLayoutVersion;
    return {
      version: v,
      confidence: 'explicit',
      detectedFeatures: [`Explicit attribute b:layoutsVersion="${v}"`],
      summary: `Blogger Layouts v${v} (Explicit)`,
    };
  }

  // 2. Inferred inspection via structural markers
  const detectedV3: string[] = [];
  for (const marker of V3_MARKERS) {
    if (marker.regex.test(text)) {
      detectedV3.push(marker.name);
    }
  }

  const detectedV1: string[] = [];
  for (const marker of V1_MARKERS) {
    if (marker.regex.test(text)) {
      detectedV1.push(marker.name);
    }
  }

  if (detectedV3.length > 0) {
    return {
      version: 3,
      confidence: 'inferred',
      detectedFeatures: detectedV3,
      summary: `Blogger Layouts v3 (Inferred: ${detectedV3.join(', ')})`,
    };
  }

  if (detectedV1.length > 0) {
    return {
      version: 1,
      confidence: 'inferred',
      detectedFeatures: detectedV1,
      summary: `Blogger Layouts v1 (Inferred: ${detectedV1.join(', ')})`,
    };
  }

  // Default to v3 in modern development
  return {
    version: 3,
    confidence: 'inferred',
    detectedFeatures: ['Default modern standard'],
    summary: 'Blogger Layouts v3 (Default)',
  };
}
