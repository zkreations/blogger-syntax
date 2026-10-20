import {
  flattenMultilineExpression,
  unescapeXmlEntities,
} from 'blogger-spec/parser';
import {
  analyzeExpressionBudget,
  countExpressionTokens,
} from 'blogger-spec/quota';
import { describe, expect, it } from 'vitest';
import { lintBloggerDocument } from '../../src/core/linter/linterEngine.js';

describe('linter core engine', () => {
  describe('deprecation rules', () => {
    it('detects deprecated attributes on <b:section> and offers quick fixes', () => {
      const xml = `<b:section id='main' growth='false' mobile='yes' preferred='yes' maxwidgets='5'></b:section>`;
      const diags = lintBloggerDocument(xml);

      const sectionDiags = diags.filter(d => d.code === 'BX1024');
      expect(sectionDiags).toHaveLength(2);
      expect(sectionDiags.some(d => d.message.includes('"preferred"'))).toBe(false);
      expect(sectionDiags.some(d => d.message.includes('maxwidgets'))).toBe(true);

      const growthDiag = sectionDiags.find(d => d.message.includes('growth'));
      expect(growthDiag).toBeDefined();
      expect(growthDiag?.tags).toContain('deprecated');
      expect(growthDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated attributes on <b:widget>', () => {
      const xml = `<b:widget id='Header1' type='Header' mobile='yes'></b:widget>`;
      const diags = lintBloggerDocument(xml);

      const widgetDiag = diags.find(d => d.code === 'BX1024');
      expect(widgetDiag).toBeDefined();
      expect(widgetDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated data:blog.isMobile and offers quick fix to data:blog.isMobileRequest', () => {
      const xml = `<b:eval expr='data:blog.isMobile ? "mobile" : "desktop"'/>`;
      const diags = lintBloggerDocument(xml);

      const isMobileDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('isMobile'));
      expect(isMobileDiag).toBeDefined();
      expect(isMobileDiag?.quickFixes?.[0]?.newText).toBe('data:blog.isMobileRequest');
    });

    it('detects deprecated data:view.isMobile and offers quick fix to data:blog.isMobileRequest', () => {
      const xml = `<b:eval expr='data:view.isMobile ? "mobile" : "desktop"'/>`;
      const diags = lintBloggerDocument(xml);

      const isMobileDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('isMobile'));
      expect(isMobileDiag).toBeDefined();
      expect(isMobileDiag?.quickFixes?.[0]?.newText).toBe('data:blog.isMobileRequest');
    });

    it('detects deprecated canonical URLs and offers quick fixes', () => {
      const xml = `<link expr:href='data:blog.canonicalUrl' rel='canonical'/>`;
      const diags = lintBloggerDocument(xml);

      const canonDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('canonicalUrl'));
      expect(canonDiag).toBeDefined();
      expect(canonDiag?.quickFixes?.[0]?.newText).toBe('data:blog.url.canonical');
    });

    it('detects obsolete inclusions and offers removal quick fixes', () => {
      const xml = `<b:include name='quickedit'/>`;
      const diags = lintBloggerDocument(xml);

      const incDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('quickedit'));
      expect(incDiag).toBeDefined();
      expect(incDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects obsolete Google+ inclusions from catalog metadata', () => {
      const xml = `
        <b:include name='googlePlusIcon'/>
        <b:include name='googlePlusBootstrap'/>
      `;
      const diags = lintBloggerDocument(xml);

      const iconDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('googlePlusIcon'));
      expect(iconDiag).toBeDefined();
      expect(iconDiag?.tags).toContain('deprecated');
      expect(iconDiag?.quickFixes?.[0]?.newText).toBe('');

      const bootstrapDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('googlePlusBootstrap'));
      expect(bootstrapDiag).toBeDefined();
      expect(bootstrapDiag?.tags).toContain('deprecated');
      expect(bootstrapDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated data:blog.mobileClass', () => {
      const xml = `<div expr:class='data:blog.mobileClass'></div>`;
      const diags = lintBloggerDocument(xml);

      const mobileClassDiag = diags.find(d => d.code === 'BX1024' && d.message.includes('mobileClass'));
      expect(mobileClassDiag).toBeDefined();
    });
  });

  describe('hallucination rules', () => {
    it('detects hallucinated tags and provides appropriate replacement suggestions', () => {
      const xml = `
        <b:for values='data:posts' var='post'>
          <b:set var='x' value='1'/>
          <b:let var='y' value='2'/>
          <b:if cond='data:x'>
            <b:elif cond='data:y'/>
          </b:if>
          <b:choose>
            <b:when test='data:z'/>
            <b:otherwise/>
          </b:choose>
        </b:for>
      `;
      const diags = lintBloggerDocument(xml);
      const tagDiags = diags.filter(d => ['BX1001', 'BX1002', 'BX1003', 'BX1004', 'BX1005', 'BX1006', 'BX1007', 'BX1008', 'BX1009'].includes(d.code));

      expect(tagDiags.length).toBeGreaterThanOrEqual(6);
      expect(tagDiags.some(d => d.code === 'BX1001')).toBe(true);
      expect(tagDiags.some(d => d.code === 'BX1003')).toBe(true);
      expect(tagDiags.some(d => d.code === 'BX1005')).toBe(true);
      expect(tagDiags.some(d => d.code === 'BX1007')).toBe(true);
      expect(tagDiags.some(d => d.code === 'BX1008')).toBe(true);
      expect(tagDiags.some(d => d.code === 'BX1009')).toBe(true);
    });

    it('detects prohibited closing tags on strictly self-closing directives', () => {
      const xml = `
        <b:eval expr='data:post.title'></b:eval>
        <b:include name='post'></b:include>
        <b:attr name='id' value='1'></b:attr>
        <b:class name='active'></b:class>
        <b:message name='home'><b:param name='x' value='1'></b:param></b:message>
        <b:template-script name='indie'></b:template-script>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags.length).toBeGreaterThanOrEqual(1);
    });

    it('detects inverted attributes on directives', () => {
      const xml = `
        <b:switch expr='data:view.type'/>
        <b:includable name='sub'/>
        <b:include id='sub'/>
      `;
      const diags = lintBloggerDocument(xml);
      const invertedDiags = diags.filter(d => ['BX1014', 'BX1015', 'BX1016'].includes(d.code));
      expect(invertedDiags).toHaveLength(3);
    });

    it('detects prohibited JS method chaining in expression attributes', () => {
      const xml = `
        <b:eval expr='data:posts.filter(p => p.allowComments)'/>
        <b:eval expr='data:posts.map(p => p.title)'/>
        <b:eval expr='data:post.title.slice(0, 100)'/>
      `;
      const diags = lintBloggerDocument(xml);
      const methodDiags = diags.filter(d => d.code === 'BX1017');
      expect(methodDiags.length).toBeGreaterThanOrEqual(3);
    });

    it('does not falsely detect JS methods inside string literals in expressions', () => {
      const xml = `
        <b:eval expr='data:post.title contains "test.filter(something)"'/>
        <b:eval expr='data:post.body contains "foo.map(x)"'/>
        <b:eval expr='data:post.body contains "test.slice(1)"'/>
      `;
      const diags = lintBloggerDocument(xml);
      const falseDiags = diags.filter(d => d.code === 'BX1017');
      expect(falseDiags).toEqual([]);
    });

    it('detects prohibited JS strict equality operators', () => {
      const xml = `
        <b:eval expr='data:a === data:b'/>
        <b:eval expr='data:a !== data:b'/>
      `;
      const diags = lintBloggerDocument(xml);
      const opDiags = diags.filter(d => d.code === 'BX1018');
      expect(opDiags).toHaveLength(2);
    });

    it('detects lambda data prefix', () => {
      const xml = `<b:eval expr='data:posts filter (p => data:p.title)'/>`;
      const diags = lintBloggerDocument(xml);
      const lambdaPrefixDiag = diags.find(d => d.code === 'BX1019');
      expect(lambdaPrefixDiag).toBeDefined();
    });
  });

  describe('quota & formatting rules', () => {
    it('reports a diagnostic when an expression exceeds the 40-token compiler quota (41+ tokens)', () => {
      const longExpr = Array.from({ length: 21 }, (_, i) => i + 1).join(' + ');
      const xml = `<b:eval expr='${longExpr}'/>`;
      const diags = lintBloggerDocument(xml);

      const quotaDiag = diags.find(d => d.code === 'BX1021');
      expect(quotaDiag).toBeDefined();
      expect(quotaDiag?.message).toContain('40');
    });

    it('does not report any quota diagnostic when expression is within safe limit (<= 35 tokens)', () => {
      const safeExpr = `[${Array.from({ length: 34 }, (_, i) => i + 1).join(', ')}]`;
      const xml = `<b:eval expr='${safeExpr}'/>`;
      const diags = lintBloggerDocument(xml);

      const quotaDiag = diags.find(d => d.code === 'BX1021');
      expect(quotaDiag).toBeUndefined();
    });

    describe('compiler quota token accounting (Horatio ground truth)', () => {
      it('counts literals and grouping parentheses correctly', () => {
        expect(countExpressionTokens('1')).toBe(1);
        expect(countExpressionTokens('(1)')).toBe(2);
        expect(countExpressionTokens('((1))')).toBe(3);
        expect(countExpressionTokens('(((1)))')).toBe(4);
      });

      it('counts arithmetic operations with nested parens', () => {
        expect(countExpressionTokens('1 + 2')).toBe(3);
        expect(countExpressionTokens('(1 + 2)')).toBe(4);
        expect(countExpressionTokens('((1 + 2))')).toBe(5);
      });

      it('counts functional prefix operations with zero-cost parens', () => {
        expect(countExpressionTokens('+(1)')).toBe(2);
        expect(countExpressionTokens('+(-1)')).toBe(2);
        expect(countExpressionTokens('-(-1)')).toBe(2);
      });

      it('counts array and object composite structures correctly', () => {
        expect(countExpressionTokens('[1]')).toBe(2);
        expect(countExpressionTokens('[1, 2]')).toBe(3);
        expect(countExpressionTokens('[[1, 2]]')).toBe(4);
        expect(countExpressionTokens('{a: 1}')).toBe(2);
        expect(countExpressionTokens('{a: 1, b: 2}')).toBe(3);
      });

      it('counts data paths as single tokens regardless of indexing and dynamic brackets', () => {
        expect(countExpressionTokens('data:arr[0]')).toBe(1);
        expect(countExpressionTokens('data:test[data:index].a')).toBe(1);
        expect(countExpressionTokens('data:test[(data:index + 1 - 1)].a')).toBe(1);
      });

      it('counts lambda and collection transformations correctly', () => {
        expect(countExpressionTokens('[1] map (x => x + 1)')).toBe(8);
        expect(countExpressionTokens('[1] map (x => x + 1 + 5)')).toBe(10);
      });

      it('counts native function calls and object options correctly', () => {
        const expr = 'snippet(data:view.description, { length: 50, links: false, linebreaks: false, ellipsis: false })';
        expect(countExpressionTokens(expr)).toBe(7);
      });

      it('flattens multiline expressions canonically without changing token cost', () => {
        const multiline = `snippet(data:view.description, {\n length: 50,\n links: false,\n linebreaks: false,\n ellipsis: false\n})`;
        expect(flattenMultilineExpression(multiline)).toBe('snippet(data:view.description, { length: 50, links: false, linebreaks: false, ellipsis: false })');
        expect(countExpressionTokens(multiline)).toBe(7);
      });

      it('decodes XML entities before tokenization', () => {
        expect(unescapeXmlEntities('&quot;hello&quot;')).toBe('"hello"');
        expect(countExpressionTokens('&quot;hello&quot;')).toBe(1);
        expect(countExpressionTokens('data:a &amp;&amp; data:b')).toBe(3);
      });

      it('validates exact 40-token limit boundaries', () => {
        const validParens = '(((1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19)))';
        expect(countExpressionTokens(validParens)).toBe(40);
        expect(analyzeExpressionBudget(validParens).isValid).toBe(true);

        const validArray = `[${Array.from({ length: 39 }, (_, i) => i + 1).join(', ')}]`;
        expect(countExpressionTokens(validArray)).toBe(40);
        expect(analyzeExpressionBudget(validArray).isValid).toBe(true);

        const invalidArray = `[${Array.from({ length: 40 }, (_, i) => i + 1).join(', ')}]`;
        expect(countExpressionTokens(invalidArray)).toBe(41);
        const invalidArrayResult = analyzeExpressionBudget(invalidArray);
        expect(invalidArrayResult.isValid).toBe(false);
        expect(invalidArrayResult.status).toBe('EXCEEDED');
      });
    });
  });

  describe('context & hallucinated data properties', () => {
    it('flags hallucinated comment.replies collection', () => {
      const xml = `<b:loop values='data:comment.replies' var='reply'/>`;
      const diags = lintBloggerDocument(xml);

      const repliesDiag = diags.find(d => d.message.includes('comment.replies'));
      expect(repliesDiag).toBeDefined();
    });

    it('flags hallucinated categories property on Label widget', () => {
      const xml = `<b:loop values='data:categories' var='cat'/>`;
      const diags = lintBloggerDocument(xml);

      const catDiag = diags.find(d => d.message.includes('data:categories'));
      expect(catDiag).toBeDefined();
    });

    it('flags hallucinated author.photo.url', () => {
      const xml = `<img expr:src='data:post.author.photo.url'/>`;
      const diags = lintBloggerDocument(xml);

      const photoDiag = diags.find(d => d.message.includes('author.photo.url'));
      expect(photoDiag).toBeDefined();
    });
  });

  describe('masking comments and CDATA', () => {
    it('ignores deprecated attributes and hallucinated tags inside XML comments', () => {
      const xml = `
        <!--
          <b:section id='old' growth='true' mobile='yes'>
            <b:for values='data:posts'/>
            <b:eval expr='data:blog.isMobile && data:a === data:b'/>
          </b:section>
        -->
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags).toEqual([]);
    });

    it('ignores expressions inside CDATA blocks', () => {
      const xml = `
        <![CDATA[
          <b:eval expr='data:blog.isMobile'/>
          <b:for values='data:posts'/>
        ]]>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags).toEqual([]);
    });
  });

  describe('rule filtering options', () => {
    it('allows selectively disabling rule groups', () => {
      const xml = `
        <b:section id='main' growth='false'></b:section>
        <b:for values='1 to 5'/>
      `;

      const diagsWithoutDeprecations = lintBloggerDocument(xml, {
        rules: { deprecations: false },
      });
      expect(diagsWithoutDeprecations.some(d => d.code === 'BX1024')).toBe(false);
      expect(diagsWithoutDeprecations.some(d => d.code === 'BX1001')).toBe(true);

      const diagsWithoutHallucinations = lintBloggerDocument(xml, {
        rules: { hallucinations: false },
      });
      expect(diagsWithoutHallucinations.some(d => d.code === 'BX1024')).toBe(true);
      expect(diagsWithoutHallucinations.some(d => d.code === 'BX1001')).toBe(false);
    });
  });

  describe('duplicate includable ID rules', () => {
    it('detects duplicate <b:includable id="..."> in the same <b:widget>', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'><div>First</div></b:includable>
          <b:includable id='main'><div>Duplicate</div></b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const dup = diags.find(d => d.code === 'BX1036');
      expect(dup).toBeDefined();
      expect(dup?.severity).toBe('error');
    });

    it('detects duplicate <b:includable id="..."> in the same <b:defaultmarkup>', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type='Common'>
            <b:includable id='test'><div>1</div></b:includable>
            <b:includable id='test'><div>2 (Duplicate)</div></b:includable>
          </b:defaultmarkup>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const dup = diags.find(d => d.code === 'BX1036');
      expect(dup).toBeDefined();
      expect(dup?.severity).toBe('error');
    });

    it('permits identical IDs in different <b:widget> blocks (isolated scopes)', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'><div>Blog</div></b:includable>
        </b:widget>
        <b:widget id='Header1' type='Header'>
          <b:includable id='main'><div>Header</div></b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const dup = diags.filter(d => d.code === 'BX1036');
      expect(dup).toHaveLength(0);
    });

    it('allows selectively disabling duplicate rules via options', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'><div>1</div></b:includable>
          <b:includable id='main'><div>2</div></b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml, { rules: { duplicates: false } });
      expect(diags.some(d => d.code === 'BX1036')).toBe(false);
    });
  });

  describe('unresolved inclusions rules', () => {
    it('detects unresolved <b:include name="..."> not in template and not on server', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:include name='ghostSubroutine'/>
          </b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.find(d => d.code === 'BX1037');
      expect(unresolved).toBeDefined();
      expect(unresolved?.severity).toBe('error');
      expect(unresolved?.message).toContain('ghostSubroutine');
    });

    it('allows universal server inclusions without error', () => {
      const xml = `
        <head>
          <b:include data='blog' name='all-head-content'/>
          <b:include data='blog' name='google-analytics'/>
          <b:include name='urlParamsAsFormInput'/>
        </head>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.filter(d => d.code === 'BX1037');
      expect(unresolved).toHaveLength(0);
    });

    it('allows common server inclusions without error', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:include name='widget-title'/>
            <b:include name='responsiveImageStyle'/>
            <b:include data='post' name='postMetadataJSON'/>
          </b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.filter(d => d.code === 'BX1037');
      expect(unresolved).toHaveLength(0);
    });

    it('allows super.* native platform invocations without error', () => {
      const xml = `
        <b:defaultmarkup type='Common'>
          <b:includable id='main'>
            <b:include name='super.main'/>
          </b:includable>
        </b:defaultmarkup>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.filter(d => d.code === 'BX1037');
      expect(unresolved).toHaveLength(0);
    });

    it('allows template-defined subroutines without error', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type='Common'>
            <b:includable id='customHelper'><div>Helper</div></b:includable>
          </b:defaultmarkup>
        </b:defaultmarkups>
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:include name='customHelper'/>
          </b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.filter(d => d.code === 'BX1037');
      expect(unresolved).toHaveLength(0);
    });

    it('allows selectively disabling inclusion validation rules via options', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:include name='ghostSubroutine'/>
          </b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml, { rules: { inclusions: false } });
      expect(diags.some(d => d.code === 'BX1037')).toBe(false);
    });

    it('ignores dynamic inclusions constructed via expr:name without flagging errors', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:include expr:name='data:post.id == 12345 ? "fullPost" : "defaultPost"'/>
          </b:includable>
        </b:widget>
      `;
      const diags = lintBloggerDocument(xml);
      const unresolved = diags.filter(d => d.code === 'BX1037');
      expect(unresolved).toHaveLength(0);
    });
  });

  describe('quick fix enhancements', () => {
    it('preserves user value when generating quick fix for inverted attribute on <b:includable>', () => {
      const xml = `<b:includable name='invertedSubroutine'/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1015');

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      expect(diag?.quickFixes?.[0]?.newText).toBe(`id='invertedSubroutine'`);
      expect(diag?.quickFixes?.[0]?.title).toBe('Replace with \'id=\'invertedSubroutine\'\'');
    });

    it('preserves user value when generating quick fix for inverted attribute on <b:include>', () => {
      const xml = `<b:include id='subroutine'/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1016');

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      expect(diag?.quickFixes?.[0]?.newText).toBe(`name='subroutine'`);
      expect(diag?.quickFixes?.[0]?.title).toBe('Replace with \'name=\'subroutine\'\'');
    });

    it('preserves user value when generating quick fix for inverted attribute on <b:switch>', () => {
      const xml = `<b:switch expr='data:blog.pageType'/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1014');

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      expect(diag?.quickFixes?.[0]?.newText).toBe(`var='data:blog.pageType'`);
      expect(diag?.quickFixes?.[0]?.title).toBe('Replace with \'var=\'data:blog.pageType\'\'');
    });

    it('generates insertion quick fix for missing mandatory attribute on <b:include>', () => {
      const xml = `<b:include/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1022');

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      expect(diag?.quickFixes?.[0]?.newText).toBe(` name=''`);
      expect(diag?.quickFixes?.[0]?.range.start).toEqual(diag?.quickFixes?.[0]?.range.end);
    });

    it('generates insertion quick fix for missing id on <b:widget> using widget type', () => {
      const xml = `<b:widget type='Blog'/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1022' && d.message.includes('\'id\''));

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      expect(diag?.quickFixes?.[0]?.newText).toBe(` id='Blog1'`);
      expect(diag?.quickFixes?.[0]?.range.start).toEqual(diag?.quickFixes?.[0]?.range.end);
    });

    it('replaces hallucinated <b:for> with <b:loop>, mapping attributes and closing tag', () => {
      const xml = `<b:for each='post' in='data:posts'>\n  <p>Iteración b:for</p>\n</b:for>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1001');

      expect(diag).toBeDefined();
      expect(diag?.quickFixes).toHaveLength(1);
      const fix = diag?.quickFixes?.[0];
      expect(fix?.newText).toBe(`<b:loop var='post' values='data:posts'>`);
      expect(fix?.edits).toHaveLength(2);
      expect(fix?.edits?.[0]?.newText).toBe(`<b:loop var='post' values='data:posts'>`);
      expect(fix?.edits?.[1]?.newText).toBe('</b:loop>');
    });

    it('preserves user quotes in hallucinated tag quick fix', () => {
      const xml = `<b:for each="post" in="data:posts"/>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1001');

      expect(diag).toBeDefined();
      const fix = diag?.quickFixes?.[0];
      expect(fix?.newText).toBe(`<b:loop var="post" values="data:posts"/>`);
      expect(fix?.edits).toHaveLength(1);
    });

    it('replaces hallucinated <b:set> with <b:with>, mapping name and expr attributes', () => {
      const xml = `<b:set name='header' expr='data:blog.title'>\n  <div><data:header/></div>\n</b:set>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1003');

      expect(diag).toBeDefined();
      const fix = diag?.quickFixes?.[0];
      expect(fix?.newText).toBe(`<b:with var='header' value='data:blog.title'>`);
      expect(fix?.edits).toHaveLength(2);
      expect(fix?.edits?.[1]?.newText).toBe('</b:with>');
    });

    it('replaces hallucinated <b:template> with <b:includable> and closing tag', () => {
      const xml = `<b:template name='postHeader'>\n  <h1>Title</h1>\n</b:template>`;
      const diags = lintBloggerDocument(xml);
      const diag = diags.find(d => d.code === 'BX1010');

      expect(diag).toBeDefined();
      const fix = diag?.quickFixes?.[0];
      expect(fix?.newText).toBe(`<b:includable id='postHeader'>`);
      expect(fix?.edits).toHaveLength(2);
      expect(fix?.edits?.[1]?.newText).toBe('</b:includable>');
    });
  });
});
