import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

export interface DocUrlOccurrence {
  url: string;
  file: string;
  line: number;
}

export function extractDocUrlsFromCodebase(): DocUrlOccurrence[] {
  const rootDir = path.resolve(__dirname, '../../src');
  const occurrences: DocUrlOccurrence[] = [];

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      }
      else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.json'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const relPath = path.relative(path.resolve(__dirname, '../..'), fullPath).replace(/\\/g, '/');

        lines.forEach((line, idx) => {
          for (const match of line.matchAll(/docUrls?:\s*(?:'([^']+)'|"([^"]+)"|\[([\s\S]*?)\])/g)) {
            if (match[1]) {
              occurrences.push({ url: match[1], file: relPath, line: idx + 1 });
            }
            else if (match[2]) {
              occurrences.push({ url: match[2], file: relPath, line: idx + 1 });
            }
            else if (match[3]) {
              for (const innerMatch of match[3].matchAll(/['"]([^'"]+)['"]/g)) {
                if (innerMatch[1]) {
                  occurrences.push({ url: innerMatch[1], file: relPath, line: idx + 1 });
                }
              }
            }
          }
        });
      }
    }
  }

  scanDir(rootDir);
  return occurrences;
}

describe('documentation links integrity (docUrls)', () => {
  const occurrences = extractDocUrlsFromCodebase();
  const uniqueUrls = Array.from(new Set(occurrences.map(o => o.url)));

  it('should find documentation URLs in the project', () => {
    expect(occurrences.length).toBeGreaterThan(0);
    expect(uniqueUrls.length).toBeGreaterThan(0);
  });

  it('should have valid and well-formed HTTPS URLs without syntax or protocol errors', () => {
    for (const occ of occurrences) {
      expect(
        occ.url.startsWith('https://'),
        `Invalid URL protocol or malformed syntax: "${occ.url}" at ${occ.file}:${occ.line}`,
      ).toBe(true);

      let parsed: URL;
      try {
        parsed = new URL(occ.url);
      }
      catch (err) {
        throw new Error(`Malformed URL "${occ.url}" at ${occ.file}:${occ.line}: ${(err as Error).message}`);
      }

      expect(parsed.hostname.length).toBeGreaterThan(0);
      expect(occ.url.trim()).toBe(occ.url);
    }
  });

  it('should only reference authorized documentation domains', () => {
    const allowedHosts = [
      'support.google.com',
      'google.com',
      'bloggercode.orbiona.com',
      'orbiona.com',
      'zkreations.com',
    ];

    for (const occ of occurrences) {
      const parsed = new URL(occ.url);
      const isAllowed = allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
      expect(
        isAllowed,
        `Unauthorized or unexpected documentation domain "${parsed.hostname}" for "${occ.url}" at ${occ.file}:${occ.line}`,
      ).toBe(true);
    }
  });

  it.runIf(process.env.CHECK_EXTERNAL_URLS === 'true')('all documentation URLs should be reachable and return HTTP 200 OK', async () => {
    let isOnline = false;
    try {
      const probe = await fetch('https://bloggercode.orbiona.com/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      isOnline = probe.ok || probe.status === 200;
    }
    catch {
      isOnline = false;
    }

    if (!isOnline) {
      console.warn('Network unreachable; skipping HTTP reachability check for docUrls.');
      return;
    }

    const checkUrl = async (url: string, attempt: number = 1): Promise<{ url: string; status: number | string; ok: boolean; error?: string }> => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(10000),
        });

        // Retry transient 503 Service Unavailable / 429 Too Many Requests due to rate limits
        if ((res.status === 503 || res.status === 429) && attempt <= 2) {
          await new Promise(resolve => setTimeout(resolve, 600 * attempt));
          return checkUrl(url, attempt + 1);
        }

        return { url, status: res.status, ok: res.status === 200 };
      }
      catch (err) {
        if (attempt <= 2) {
          await new Promise(resolve => setTimeout(resolve, 600 * attempt));
          return checkUrl(url, attempt + 1);
        }
        return { url, status: 'ERROR', ok: false, error: (err as Error).message };
      }
    };

    const results: Array<{ url: string; status: number | string; ok: boolean; error?: string }> = [];
    const concurrency = 6;

    for (let i = 0; i < uniqueUrls.length; i += concurrency) {
      const batch = uniqueUrls.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(u => checkUrl(u)));
      results.push(...batchResults);
      if (i + concurrency < uniqueUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    const failures = results
      .filter(r => !r.ok)
      .map((r) => {
        const occ = occurrences.find(o => o.url === r.url);
        return {
          url: r.url,
          status: r.status,
          error: r.error,
          location: occ ? `${occ.file}:${occ.line}` : 'unknown',
        };
      });

    expect(failures).toEqual([]);
  }, 90000);
});
