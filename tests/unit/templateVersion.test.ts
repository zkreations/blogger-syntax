import { describe, expect, it } from 'vitest';
import { detectTemplateVersion } from '../../src/core/version/templateVersion.js';

describe('template version detector', () => {
  it('detects explicit layoutsVersion attribute on <html>', () => {
    const xml = `<html b:layoutsVersion='3' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b'></html>`;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(3);
    expect(res.confidence).toBe('explicit');
  });

  it('detects explicit b:version attribute', () => {
    const xml = `<html b:version='2'></html>`;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(2);
    expect(res.confidence).toBe('explicit');
  });

  it('detects explicit b:layoutsVersion="1" attribute', () => {
    const xml = `<html b:layoutsVersion='1'></html>`;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(1);
    expect(res.confidence).toBe('explicit');
  });

  it('infers Layouts v3 from modern structural markers', () => {
    const xml = `
      <html>
        <b:defaultmarkups>
          <b:defaultmarkup type='Blog'/>
        </b:defaultmarkups>
        <b:template-script name='indie'/>
        <b:section id='main' tag='main'/>
      </html>
    `;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(3);
    expect(res.confidence).toBe('inferred');
    expect(res.detectedFeatures).toContain('b:defaultmarkups');
    expect(res.detectedFeatures).toContain('b:template-script');
    expect(res.detectedFeatures).toContain('semantic b:section tag');
  });

  it('infers Layouts v1 from legacy section attributes', () => {
    const xml = `
      <html>
        <b:section id='main' growth='false' maxwidgets='5'>
          <b:widget id='Blog1' type='Blog'/>
        </b:section>
      </html>
    `;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(1);
    expect(res.confidence).toBe('inferred');
    expect(res.detectedFeatures).toContain('legacy section attribute (growth)');
  });

  it('defaults to v3 modern standard when no markers exist', () => {
    const xml = `<html><head></head><body></body></html>`;
    const res = detectTemplateVersion(xml);
    expect(res.version).toBe(3);
    expect(res.confidence).toBe('inferred');
  });
});
