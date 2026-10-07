import { describe, expect, it } from 'vitest';
import { lintBloggerDocument } from '../../src/core/linter/linterEngine.js';
import {
  analyzeExpressionBudget,
  countExpressionTokens,
  flattenMultilineExpression,
  unescapeXmlEntities,
} from '../../src/core/linter/rules/quotaRules.js';

describe('linter core engine', () => {
  describe('deprecation rules', () => {
    it('detects deprecated attributes on <b:section> and offers quick fixes', () => {
      const xml = `<b:section id='main' growth='false' mobile='yes' preferred='yes' maxwidgets='5'></b:section>`;
      const diags = lintBloggerDocument(xml);

      const sectionDiags = diags.filter(d => d.code === 'blogger.deprecated.section-attribute');
      expect(sectionDiags).toHaveLength(3);
      expect(sectionDiags.some(d => d.message.includes('"preferred"'))).toBe(false);

      const growthDiag = sectionDiags.find(d => d.message.includes('"growth"'));
      expect(growthDiag).toBeDefined();
      expect(growthDiag?.tags).toContain('deprecated');
      expect(growthDiag?.quickFixes?.[0]?.title).toBe('Remove obsolete attribute "growth"');
      expect(growthDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated attributes on <b:widget>', () => {
      const xml = `<b:widget id='Header1' type='Header' mobile='yes'></b:widget>`;
      const diags = lintBloggerDocument(xml);

      const widgetDiag = diags.find(d => d.code === 'blogger.deprecated.widget-attribute');
      expect(widgetDiag).toBeDefined();
      expect(widgetDiag?.message).toContain('obsolete in Blogger Layouts v3');
      expect(widgetDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated data:blog.isMobile and offers quick fix to data:blog.isMobileRequest', () => {
      const xml = `<b:eval expr='data:blog.isMobile ? "mobile" : "desktop"'/>`;
      const diags = lintBloggerDocument(xml);

      const isMobileDiag = diags.find(d => d.code === 'blogger.deprecated.isMobile');
      expect(isMobileDiag).toBeDefined();
      expect(isMobileDiag?.quickFixes?.[0]?.newText).toBe('data:blog.isMobileRequest');
    });

    it('detects deprecated data:view.isMobile and offers quick fix to data:blog.isMobileRequest', () => {
      const xml = `<b:eval expr='data:view.isMobile ? "mobile" : "desktop"'/>`;
      const diags = lintBloggerDocument(xml);

      const isMobileDiag = diags.find(d => d.code === 'blogger.deprecated.isMobile');
      expect(isMobileDiag).toBeDefined();
      expect(isMobileDiag?.quickFixes?.[0]?.newText).toBe('data:blog.isMobileRequest');
    });

    it('detects deprecated canonical URLs and offers quick fixes', () => {
      const xml = `<link expr:href='data:blog.canonicalUrl' rel='canonical'/>`;
      const diags = lintBloggerDocument(xml);

      const canonDiag = diags.find(d => d.code === 'blogger.deprecated.canonicalUrl');
      expect(canonDiag).toBeDefined();
      expect(canonDiag?.quickFixes?.[0]?.newText).toBe('data:blog.url.canonical');
    });

    it('detects obsolete inclusions and offers removal quick fixes', () => {
      const xml = `<b:include name='quickedit'/>`;
      const diags = lintBloggerDocument(xml);

      const incDiag = diags.find(d => d.code === 'blogger.deprecated.inclusion');
      expect(incDiag).toBeDefined();
      expect(incDiag?.quickFixes?.[0]?.newText).toBe('');
    });

    it('detects deprecated data:blog.mobileClass', () => {
      const xml = `<div expr:class='data:blog.mobileClass'></div>`;
      const diags = lintBloggerDocument(xml);

      const mobileClassDiag = diags.find(d => d.code === 'blogger.deprecated.mobileClass');
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
      const tagDiags = diags.filter(d => d.code === 'blogger.hallucination.tag');

      const tagsFound = tagDiags.map(d => d.quickFixes?.[0]?.newText);
      expect(tagsFound).toContain('b:loop');
      expect(tagsFound).toContain('b:with');
      expect(tagsFound).toContain('b:elseif');
      expect(tagsFound).toContain('b:switch');
      expect(tagsFound).toContain('b:case');
      expect(tagsFound).toContain('b:default');
    });

    it('detects prohibited closing tags for self-closing delimiters', () => {
      const xml = `
        <b:switch var='data:view.type'>
          <b:case value='item'>
            <p>Item</p>
          </b:case>
        </b:switch>
      `;
      const diags = lintBloggerDocument(xml);
      const closingDiag = diags.find(d => d.code === 'blogger.hallucination.closing-tag');
      expect(closingDiag).toBeDefined();
      expect(closingDiag?.message).toContain('strictly a self-closing branch delimiter');
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
      const closingDiags = diags.filter(d => d.code === 'blogger.hallucination.closing-tag');
      expect(closingDiags).toHaveLength(6);
      expect(closingDiags.some(d => d.message.includes('</b:eval>'))).toBe(true);
      expect(closingDiags.some(d => d.message.includes('</b:include>'))).toBe(true);
      expect(closingDiags.some(d => d.message.includes('</b:attr>'))).toBe(true);
      expect(closingDiags.some(d => d.message.includes('</b:class>'))).toBe(true);
      expect(closingDiags.some(d => d.message.includes('</b:param>'))).toBe(true);
      expect(closingDiags.some(d => d.message.includes('</b:template-script>'))).toBe(true);
    });

    it('detects unclosed strictly self-closing tags and offers quick fixes', () => {
      const xml = `<b:eval expr='snippet(data:view.description, { length: 150 })'>`;
      const diags = lintBloggerDocument(xml);
      const selfCloseDiag = diags.find(d => d.code === 'blogger.syntax.self-closing-required');

      expect(selfCloseDiag).toBeDefined();
      expect(selfCloseDiag?.severity).toBe('error');
      expect(selfCloseDiag?.message).toContain('<b:eval> is strictly a self-closing tag');
      expect(selfCloseDiag?.quickFixes?.[0]?.newText).toBe('/>');
      expect(selfCloseDiag?.quickFixes?.[0]?.title).toBe('Close <b:eval/> with \'/>\'');

      // Verify that applying the quick fix produces valid self-closing syntax
      const fix = selfCloseDiag!.quickFixes![0]!;
      const lines = xml.split('\n');
      const startLine = lines[fix.range.start.line]!;
      const modifiedLine = startLine.slice(0, fix.range.start.character)
        + fix.newText
        + startLine.slice(fix.range.end.character);
      expect(modifiedLine).toBe('<b:eval expr=\'snippet(data:view.description, { length: 150 })\'/>');
    });

    it('detects other unclosed strictly self-closing tags like <b:else>, <b:include>, <b:param>', () => {
      const xml = `
        <b:if cond='data:view.isPost'>
          <b:include name='post'>
          <b:else>
          <b:param name='x' value='1'>
        </b:if>
      `;
      const diags = lintBloggerDocument(xml);
      const selfCloseDiags = diags.filter(d => d.code === 'blogger.syntax.self-closing-required');
      expect(selfCloseDiags).toHaveLength(3);
      expect(selfCloseDiags.some(d => d.message.includes('<b:include>'))).toBe(true);
      expect(selfCloseDiags.some(d => d.message.includes('<b:else>'))).toBe(true);
      expect(selfCloseDiags.some(d => d.message.includes('<b:param>'))).toBe(true);
    });

    it('detects inverted attributes on directives', () => {
      const xml = `
        <b:switch expr='data:view.type'/>
        <b:includable name='sub'/>
        <b:include id='sub'/>
      `;
      const diags = lintBloggerDocument(xml);
      const invertedDiags = diags.filter(d => d.code === 'blogger.syntax.inverted-attribute');
      expect(invertedDiags).toHaveLength(3);
    });

    it('detects missing expr: prefix on dynamic attributes', () => {
      const xml = `<b:tag name='data:view.isPost ? "h1" : "h2"'/>`;
      const diags = lintBloggerDocument(xml);
      const missingExprDiag = diags.find(d => d.code === 'blogger.syntax.missing-expr-prefix');
      expect(missingExprDiag).toBeDefined();
      expect(missingExprDiag?.quickFixes?.[0]?.newText).toBe('expr:name');
    });

    it('detects prohibited JS method chaining in expression attributes', () => {
      const xml = `
        <b:eval expr='data:posts.filter(p => p.allowComments)'/>
        <b:eval expr='data:posts.map(p => p.title)'/>
        <b:eval expr='data:post.title.slice(0, 100)'/>
      `;
      const diags = lintBloggerDocument(xml);
      const methodDiags = diags.filter(d => d.code === 'blogger.hallucination.js-method');
      expect(methodDiags.length).toBeGreaterThanOrEqual(3);

      const filterDiag = methodDiags.find(d => d.message.includes('.filter()'));
      expect(filterDiag?.quickFixes?.[0]?.newText).toBe(' filter (');

      const mapDiag = methodDiags.find(d => d.message.includes('.map()'));
      expect(mapDiag?.quickFixes?.[0]?.newText).toBe(' map (');
    });

    it('does not falsely detect JS methods, operators, or messages inside string literals in expressions', () => {
      const xml = `
        <b:eval expr='data:post.title contains "test.filter(something)"'/>
        <b:eval expr='data:post.body contains "foo.map(x)"'/>
        <b:eval expr='data:post.body contains "test.slice(1)"'/>
        <b:eval expr='data:post.snippet contains "=== TITLE ==="'/>
        <b:eval expr='data:post.body contains "data:messages.byAuthor"'/>
      `;
      const diags = lintBloggerDocument(xml);
      const falseDiags = diags.filter(d =>
        d.code === 'blogger.hallucination.js-method'
        || d.code === 'blogger.hallucination.js-operator'
        || d.code === 'blogger.syntax.parameterized-message-direct-invocation',
      );
      expect(falseDiags).toEqual([]);
    });

    it('detects prohibited JS strict equality and logical operators', () => {
      const xml = `
        <b:eval expr='data:a === data:b'/>
        <b:eval expr='data:a !== data:b'/>
        <b:eval expr='data:a && data:b'/>
        <b:eval expr='data:a || data:b'/>
      `;
      const diags = lintBloggerDocument(xml);
      const opDiags = diags.filter(d => d.code === 'blogger.hallucination.js-operator');
      expect(opDiags).toHaveLength(4);

      expect(opDiags[0]?.quickFixes?.[0]?.newText).toBe('==');
      expect(opDiags[1]?.quickFixes?.[0]?.newText).toBe('!=');
      expect(opDiags[2]?.quickFixes?.[0]?.newText).toBe('and');
      expect(opDiags[3]?.quickFixes?.[0]?.newText).toBe('or');
    });

    it('detects lambda data prefix', () => {
      const xml = `<b:eval expr='data:posts filter (p => data:p.title)'/>`;
      const diags = lintBloggerDocument(xml);
      const lambdaPrefixDiag = diags.find(d => d.code === 'blogger.hallucination.lambda-data-prefix');
      expect(lambdaPrefixDiag).toBeDefined();
    });

    it('detects scalar <data:...> tags containing operators', () => {
      const xml = `<data:post.title ?: "Default"/>`;
      const diags = lintBloggerDocument(xml);
      const dataOpDiag = diags.find(d => d.code === 'blogger.syntax.data-tag-contains-operators');
      expect(dataOpDiag).toBeDefined();
    });

    it('detects direct invocation of parameterized messages', () => {
      const xml = `
        <data:messages.numberOfComments/>
        <data:messages.byAuthor/>
        <b:eval expr='data:messages.authorSaid'/>
      `;
      const diags = lintBloggerDocument(xml);
      const paramDiags = diags.filter(d => d.code === 'blogger.syntax.parameterized-message-direct-invocation');
      expect(paramDiags).toHaveLength(3);
    });
  });

  describe('quota & formatting rules', () => {
    it('reports an error when an expression exceeds the 40-token compiler quota (41+ tokens)', () => {
      const longExpr = Array.from({ length: 21 }, (_, i) => i + 1).join(' + ');
      const xml = `<b:eval expr='${longExpr}'/>`;
      const diags = lintBloggerDocument(xml);

      const quotaDiag = diags.find(d => d.code === 'blogger.quota.token-limit');
      expect(quotaDiag).toBeDefined();
      expect(quotaDiag?.severity).toBe('error');
      expect(quotaDiag?.message).toContain('maximum is 40');
      expect(quotaDiag?.message).toContain('currently 41 tokens');
    });

    it('warns when an expression is within the warning threshold (36 to 40 tokens)', () => {
      // 36 tokens: [1, 2, ..., 35] -> 1 (bracket) + 35 (numbers) = 36 tokens
      const warnExpr36 = `[${Array.from({ length: 35 }, (_, i) => i + 1).join(', ')}]`;
      const xml36 = `<b:eval expr='${warnExpr36}'/>`;
      const diags36 = lintBloggerDocument(xml36);

      const quotaDiag36 = diags36.find(d => d.code === 'blogger.quota.token-limit');
      expect(quotaDiag36).toBeDefined();
      expect(quotaDiag36?.severity).toBe('warning');
      expect(quotaDiag36?.message).toContain('currently 36 tokens');

      // 40 tokens: [1, 2, ..., 39] -> 1 (bracket) + 39 (numbers) = 40 tokens
      const warnExpr40 = `[${Array.from({ length: 39 }, (_, i) => i + 1).join(', ')}]`;
      const xml40 = `<b:eval expr='${warnExpr40}'/>`;
      const diags40 = lintBloggerDocument(xml40);

      const quotaDiag40 = diags40.find(d => d.code === 'blogger.quota.token-limit');
      expect(quotaDiag40).toBeDefined();
      expect(quotaDiag40?.severity).toBe('warning');
      expect(quotaDiag40?.message).toContain('currently 40 tokens');
    });

    it('does not report any quota diagnostic when expression is within safe limit (<= 35 tokens)', () => {
      // 35 tokens: [1, 2, ..., 34] -> 1 + 34 = 35 tokens
      const safeExpr = `[${Array.from({ length: 34 }, (_, i) => i + 1).join(', ')}]`;
      const xml = `<b:eval expr='${safeExpr}'/>`;
      const diags = lintBloggerDocument(xml);

      const quotaDiag = diags.find(d => d.code === 'blogger.quota.token-limit');
      expect(quotaDiag).toBeUndefined();
    });

    it('warns on unspaced colons in object literals to prevent XML QName collision', () => {
      const xml = `<b:eval expr='snippet(data:post.body, {length:150})'/>`;
      const diags = lintBloggerDocument(xml);

      const colonDiag = diags.find(d => d.code === 'blogger.syntax.object-colon-spacing');
      expect(colonDiag).toBeDefined();
      expect(colonDiag?.quickFixes?.[0]?.newText).toBe(': ');
    });

    it('does not falsely warn on data: tags or expressions inside object literals', () => {
      const xml = `
        <b:with value='{ current: (data:link.title contains data:prefix), next: (data:links[data:i + 1].title contains data:prefix) }' var='state'/>
        <b:eval expr="{ name: data:blog.title, descrption: data:view.description }"/>
        <b:with value='{ min: (data:depth ?: 1), max: 5 }' var='depths'/>
      `;
      const diags = lintBloggerDocument(xml);
      const colonDiags = diags.filter(d => d.code === 'blogger.syntax.object-colon-spacing');
      expect(colonDiags).toEqual([]);
    });

    it('does not warn when object literal colons are properly spaced', () => {
      const xml = `<b:eval expr='snippet(data:post.body, { length: 150 })'/>`;
      const diags = lintBloggerDocument(xml);

      const colonDiag = diags.find(d => d.code === 'blogger.syntax.object-colon-spacing');
      expect(colonDiag).toBeUndefined();
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

        const validObjPairs = Array.from({ length: 39 }, (_, i) => `k${i}: ${i + 1}`).join(', ');
        const validObj = `{ ${validObjPairs} }`;
        expect(countExpressionTokens(validObj)).toBe(40);
        expect(analyzeExpressionBudget(validObj).isValid).toBe(true);

        const invalidObjPairs = Array.from({ length: 40 }, (_, i) => `k${i}: ${i + 1}`).join(', ');
        const invalidObj = `{ ${invalidObjPairs} }`;
        expect(countExpressionTokens(invalidObj)).toBe(41);
        const invalidObjResult = analyzeExpressionBudget(invalidObj);
        expect(invalidObjResult.isValid).toBe(false);
        expect(invalidObjResult.status).toBe('EXCEEDED');
      });

      it('detects directive tag nesting exceeding 50 levels', () => {
        let deepXml = '';
        for (let i = 0; i < 52; i++) {
          deepXml += `<b:with value='1' var='v${i}'>`;
        }
        for (let i = 0; i < 52; i++) {
          deepXml += `</b:with>`;
        }
        const diags = lintBloggerDocument(deepXml);
        const nestingDiags = diags.filter(d => d.code === 'blogger.quota.nesting-limit');
        expect(nestingDiags.length).toBeGreaterThanOrEqual(1);
        expect(nestingDiags[0]?.message).toContain('Directive tag nesting exceeds Blogger compiler ceiling');
      });
    });
  });

  describe('context & hallucinated data properties', () => {
    it('does NOT warn on canonical post.comments in comment loops or recursion', () => {
      const xml = `<b:with value='data:post.comments where (c => c.inReplyTo == data:comment.id)' var='replies'/>`;
      const diags = lintBloggerDocument(xml);
      expect(diags).toEqual([]);
    });

    it('flags hallucinated comment.replies collection', () => {
      const xml = `<b:loop values='data:comment.replies' var='reply'/>`;
      const diags = lintBloggerDocument(xml);

      const repliesDiag = diags.find(d => d.code === 'blogger.hallucination.data-property');
      expect(repliesDiag).toBeDefined();
      expect(repliesDiag?.message).toContain('comment.replies');
    });

    it('flags hallucinated categories property on Label widget', () => {
      const xml = `<b:loop values='data:categories' var='cat'/>`;
      const diags = lintBloggerDocument(xml);

      const catDiag = diags.find(d => d.code === 'blogger.hallucination.data-property');
      expect(catDiag).toBeDefined();
      expect(catDiag?.message).toContain('data:categories');
    });

    it('flags hallucinated author.photo.url', () => {
      const xml = `<img expr:src='data:post.author.photo.url'/>`;
      const diags = lintBloggerDocument(xml);

      const photoDiag = diags.find(d => d.code === 'blogger.hallucination.data-property');
      expect(photoDiag).toBeDefined();
      expect(photoDiag?.message).toContain('author.photo.url');
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
      expect(diagsWithoutDeprecations.some(d => d.code.startsWith('blogger.deprecated'))).toBe(false);
      expect(diagsWithoutDeprecations.some(d => d.code === 'blogger.hallucination.tag')).toBe(true);

      const diagsWithoutHallucinations = lintBloggerDocument(xml, {
        rules: { hallucinations: false },
      });
      expect(diagsWithoutHallucinations.some(d => d.code === 'blogger.deprecated.section-attribute')).toBe(true);
      expect(diagsWithoutHallucinations.some(d => d.code.startsWith('blogger.hallucination'))).toBe(false);
    });
  });
});
