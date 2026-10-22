import type * as vscode from 'vscode';
import { describe, expect, it } from 'vitest';
import { lintBloggerDocument } from '../../src/core/linter/linterEngine.js';
import {
  buildSuppressionQuickFixes,
  isDiagnosticSuppressed,
  matchesRule,
  scanSuppressionDirectives,
} from '../../src/core/linter/linterSuppression.js';
import { computeLineOffsets } from '../../src/core/linter/linterUtils.js';
import { BloggerCodeActionProvider } from '../../src/vscode/providers/codeActionProvider.js';
import { BloggerDiagnosticProvider } from '../../src/vscode/providers/diagnosticProvider.js';
import { MockTextDocument, Range } from './__mocks__/vscode.js';

describe('linter Comment Suppression & QuickFixes', () => {
  describe('scanSuppressionDirectives', () => {
    it('parses disable-next-line with specific rule codes and aliases', () => {
      const text = [
        '<!-- blogger-lint-disable-next-line BX1025 -->',
        '<data:otracosa/>',
        '<!-- blogger-lint-disable-next-line unresolved-data, BX1037 -->',
        '<data:foo/>',
        '<!-- blogger-lint-disable-next-line -->',
        '<data:all/>',
      ].join('\n');

      const lineOffsets = computeLineOffsets(text);
      const directives = scanSuppressionDirectives(text, lineOffsets);

      expect(directives).toHaveLength(3);
      expect(directives[0]?.type).toBe('disable-next-line');
      expect(directives[0]?.rules).toBeInstanceOf(Set);
      expect((directives[0]?.rules as Set<string>).has('bx1025')).toBe(true);
      expect(directives[0]?.line).toBe(0);

      expect(directives[1]?.rules).toBeInstanceOf(Set);
      expect((directives[1]?.rules as Set<string>).has('unresolved-data')).toBe(true);
      expect((directives[1]?.rules as Set<string>).has('bx1037')).toBe(true);
      expect(directives[1]?.line).toBe(2);

      expect(directives[2]?.rules).toBe('all');
      expect(directives[2]?.line).toBe(4);
    });

    it('parses block disable and enable directives', () => {
      const text = [
        '<!-- blogger-lint-disable BX1025 -->',
        '<data:var1/>',
        '<data:var2/>',
        '<!-- blogger-lint-enable BX1025 -->',
      ].join('\n');

      const lineOffsets = computeLineOffsets(text);
      const directives = scanSuppressionDirectives(text, lineOffsets);

      expect(directives).toHaveLength(2);
      expect(directives[0]?.type).toBe('disable');
      expect(directives[1]?.type).toBe('enable');
    });
  });

  describe('matchesRule', () => {
    it('matches exact rule codes case-insensitively', () => {
      const rules = new Set(['bx1025', 'bx1037']);
      expect(matchesRule('BX1025', rules)).toBe(true);
      expect(matchesRule('bx1025', rules)).toBe(true);
      expect(matchesRule('BX1037', rules)).toBe(true);
      expect(matchesRule('BX1001', rules)).toBe(false);
    });

    it('matches category aliases to diagnostic codes', () => {
      const rules = new Set(['unresolved-data']);
      expect(matchesRule('BX1025', rules)).toBe(true);

      const depRules = new Set(['deprecations']);
      expect(matchesRule('BX1024', depRules)).toBe(true);
    });

    it('wildcard all matches any diagnostic code', () => {
      expect(matchesRule('BX1025', 'all')).toBe(true);
      expect(matchesRule('BX1001', 'all')).toBe(true);
    });
  });

  describe('isDiagnosticSuppressed', () => {
    it('suppresses diagnostic when disable-next-line matches rule', () => {
      const text = [
        '<!-- blogger-lint-disable-next-line BX1025 -->',
        '<data:unknown/>',
        '<data:secondUnknown/>',
      ].join('\n');

      const lineOffsets = computeLineOffsets(text);
      const directives = scanSuppressionDirectives(text, lineOffsets);

      const diag1 = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 15 } },
      };
      const diag2 = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 21 } },
      };

      expect(isDiagnosticSuppressed(diag1, directives)).toBe(true);
      expect(isDiagnosticSuppressed(diag2, directives)).toBe(false);
    });

    it('suppresses diagnostic when disable-line is on the same line', () => {
      const text = '<data:unknown/> <!-- blogger-lint-disable-line BX1025 -->';
      const lineOffsets = computeLineOffsets(text);
      const directives = scanSuppressionDirectives(text, lineOffsets);

      const diag = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 15 } },
      };

      expect(isDiagnosticSuppressed(diag, directives)).toBe(true);
    });

    it('suppresses diagnostics within block disable and restores after enable', () => {
      const text = [
        '<!-- blogger-lint-disable BX1025 -->',
        '<data:first/>',
        '<data:second/>',
        '<!-- blogger-lint-enable BX1025 -->',
        '<data:third/>',
      ].join('\n');

      const lineOffsets = computeLineOffsets(text);
      const directives = scanSuppressionDirectives(text, lineOffsets);

      const diagInside1 = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 13 } },
      };
      const diagInside2 = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 14 } },
      };
      const diagAfter = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 4, character: 0 }, end: { line: 4, character: 13 } },
      };

      expect(isDiagnosticSuppressed(diagInside1, directives)).toBe(true);
      expect(isDiagnosticSuppressed(diagInside2, directives)).toBe(true);
      expect(isDiagnosticSuppressed(diagAfter, directives)).toBe(false);
    });
  });

  describe('linter integration with suppression directives', () => {
    it('silences unresolvedData warning when suppressed via disable-next-line', () => {
      const code = [
        '<!-- blogger-lint-disable-next-line BX1025 -->',
        '<data:myDynamicField/>',
      ].join('\n');

      const diags = lintBloggerDocument(code);
      expect(diags).toHaveLength(0);
    });

    it('silences unresolvedData warning when suppressed via category alias', () => {
      const code = [
        '<!-- blogger-lint-disable-next-line unresolved-data -->',
        '<data:myDynamicField/>',
      ].join('\n');

      const diags = lintBloggerDocument(code);
      expect(diags).toHaveLength(0);
    });

    it('silences multiple diagnostics in decoupled Common includables using block suppression', () => {
      const code = [
        '<b:defaultmarkups>',
        '  <b:defaultmarkup type="Common">',
        '    <b:includable id="comment:form">',
        '      <!-- blogger-lint-disable unresolved-data -->',
        '      <data:post.cmtfpIframe/>',
        '      <data:texts.restore/>',
        '      <!-- blogger-lint-enable unresolved-data -->',
        '      <data:post.shouldWarnAfterEnable/>',
        '    </b:includable>',
        '  </b:defaultmarkup>',
        '</b:defaultmarkups>',
      ].join('\n');

      const diags = lintBloggerDocument(code);
      expect(diags).toHaveLength(1);
      expect(diags[0]?.message).toContain('shouldWarnAfterEnable');
    });
  });

  describe('suppression QuickFix generation', () => {
    it('generates line and file suppression QuickFixes with matching indentation', () => {
      const doc = '        <data:unresolvedField/>';
      const lineOffsets = computeLineOffsets(doc);
      const diag = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 0, character: 8 }, end: { line: 0, character: 31 } },
      };

      const fixes = buildSuppressionQuickFixes(diag, lineOffsets, doc);
      expect(fixes).toHaveLength(2);

      const lineFix = fixes[0]!;
      expect(lineFix.title).toBe('Disable rule BX1025 for this line');
      expect(lineFix.newText).toBe('        <!-- blogger-lint-disable-next-line BX1025 -->\n');
      expect(lineFix.range.start.line).toBe(0);
      expect(lineFix.range.start.character).toBe(0);
      expect(lineFix.isPreferred).toBe(false);

      const fileFix = fixes[1]!;
      expect(fileFix.title).toBe('Disable rule BX1025 for entire file');
      expect(fileFix.newText).toBe('<!-- blogger-lint-disable BX1025 -->\n');
      expect(fileFix.range.start.line).toBe(0);
      expect(fileFix.range.start.character).toBe(0);
    });

    it('inserts file suppression directive after <html...> preamble preserving xml declaration', () => {
      const doc = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<!DOCTYPE html>',
        '<html b:css="false">',
        '  <head>',
        '    <data:unresolvedField/>',
        '  </head>',
        '</html>',
      ].join('\n');

      const lineOffsets = computeLineOffsets(doc);
      const diag = {
        code: 'BX1025',
        message: 'err',
        severity: 'warning' as const,
        range: { start: { line: 4, character: 4 }, end: { line: 4, character: 27 } },
      };

      const fixes = buildSuppressionQuickFixes(diag, lineOffsets, doc);
      const fileFix = fixes.find(f => f.title === 'Disable rule BX1025 for entire file');

      expect(fileFix).toBeDefined();
      // Must be inserted after <html...> on line 3, NOT at line 0
      expect(fileFix?.range.start.line).toBe(3);
      expect(fileFix?.range.start.character).toBe(0);

      // Verify that applying the fix suppresses the diagnostic
      const lines = doc.split('\n');
      lines.splice(3, 0, fileFix!.newText.trimEnd());
      const updatedDoc = lines.join('\n');

      const diags = lintBloggerDocument(updatedDoc);
      expect(diags).toHaveLength(0);
    });

    it('provides suppression CodeActions in VS Code CodeActionProvider', () => {
      const diagnosticProvider = new BloggerDiagnosticProvider();
      const codeActionProvider = new BloggerCodeActionProvider(diagnosticProvider);

      const doc = new MockTextDocument(
        '<div><data:unknownField/></div>',
        'file:///test-suppress.xml',
        1,
        'xml',
      ) as unknown as vscode.TextDocument;

      diagnosticProvider.validateDocument(doc, true);

      const cursorRange = new Range(0, 5, 0, 25) as unknown as vscode.Range;
      const context = {
        diagnostics: [],
        only: undefined,
        triggerKind: 1,
      } as unknown as vscode.CodeActionContext;

      const actions = codeActionProvider.provideCodeActions(doc, cursorRange, context);

      expect(actions.length).toBeGreaterThanOrEqual(2);
      expect(actions.some(a => a.title === 'Disable rule BX1025 for this line')).toBe(true);
      expect(actions.some(a => a.title === 'Disable rule BX1025 for entire file')).toBe(true);

      diagnosticProvider.dispose();
    });
  });
});
