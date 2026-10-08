import { describe, expect, it } from 'vitest';
import { lintBloggerDocument } from '../../src/core/linter/linterEngine.js';

describe('linter contracts & horatio specifications', () => {
  describe('mandatory attributes on directives', () => {
    it('detects missing id on <b:section>', () => {
      const xml = `<b:section></b:section>`;
      const diags = lintBloggerDocument(xml);
      const missingId = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"id"'));
      expect(missingId).toBeDefined();
    });

    it('detects empty id on <b:section>', () => {
      const xml = `<b:section id=''></b:section>`;
      const diags = lintBloggerDocument(xml);
      const emptyId = diags.find(d => d.code === 'blogger.syntax.empty-attribute' && d.message.includes('"id"'));
      expect(emptyId).toBeDefined();
    });

    it('detects missing id and type on <b:widget>', () => {
      const xml = `<b:section id='main'><b:widget></b:widget></b:section>`;
      const diags = lintBloggerDocument(xml);

      expect(diags.some(d => d.code === 'blogger.missing.attribute' && d.message.includes('"id"'))).toBe(true);
      expect(diags.some(d => d.code === 'blogger.missing.attribute' && d.message.includes('"type"'))).toBe(true);
    });

    it('allows title to be omitted or empty on <b:widget>', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='HTML1' type='HTML' title=''>
            <b:includable id='main'/>
          </b:widget>
          <b:widget id='HTML2' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const titleDiags = diags.filter(d => d.message.toLowerCase().includes('title'));
      expect(titleDiags).toHaveLength(0);
    });

    it('detects missing required attributes on <b:loop> and <b:with>', () => {
      const xml = `
        <b:loop>
          <b:with/>
        </b:loop>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags.some(d => d.code === 'blogger.missing.attribute' && d.message.includes('b:loop'))).toBe(true);
      expect(diags.some(d => d.code === 'blogger.missing.attribute' && d.message.includes('b:with'))).toBe(true);
    });
  });

  describe('strict widget ID format and type matching', () => {
    it('accepts correct ID matching type + number (e.g. HTML1 for HTML, Blog1 for Blog)', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='HTML1' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
          <b:widget id='Blog1' type='Blog'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const idDiags = diags.filter(d => d.code === 'blogger.syntax.invalid-widget-id');
      expect(idDiags).toHaveLength(0);
    });

    it('enforces exact case-sensitivity on ID prefix (e.g. html1 for HTML is invalid)', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='html1' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidId = diags.find(d => d.code === 'blogger.syntax.invalid-widget-id');
      expect(invalidId).toBeDefined();
      expect(invalidId?.message).toContain('HTML');
    });

    it('rejects widget ID with mismatched prefix (e.g. Widget1 for type HTML)', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='Widget1' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidId = diags.find(d => d.code === 'blogger.syntax.invalid-widget-id');
      expect(invalidId).toBeDefined();
      expect(invalidId?.message).toContain('does not match widget type "HTML"');
    });

    it('rejects widget ID without number or with number 0', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='HTML' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
          <b:widget id='HTML0' type='HTML'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidIds = diags.filter(d => d.code === 'blogger.syntax.invalid-widget-id');
      expect(invalidIds).toHaveLength(2);
    });

    it('flags unknown widget types', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='Custom1' type='Custom'>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const unknownType = diags.find(d => d.code === 'blogger.syntax.unknown-widget-type');
      expect(unknownType).toBeDefined();
    });

    it('prohibits expr: on static-only attributes like id', () => {
      const xml = `<b:section expr:id='data:blog.id'></b:section>`;
      const diags = lintBloggerDocument(xml);
      const dynamicAttr = diags.find(d => d.code === 'blogger.syntax.invalid-dynamic-attribute');
      expect(dynamicAttr).toBeDefined();
    });
  });

  describe('template-level document invariants', () => {
    it('requires <b:skin> in <head> and at least one <b:section> in <body> for full templates', () => {
      const xml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>My Blog</title>
          </head>
          <body>
          </body>
        </html>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags.some(d => d.code === 'blogger.structure.missing-skin')).toBe(true);
      expect(diags.some(d => d.code === 'blogger.structure.missing-section')).toBe(true);
    });

    it('passes clean full template with <b:skin> and <b:section>', () => {
      const xml = `
        <!DOCTYPE html>
        <html>
          <head>
            <b:skin><![CDATA[]]></b:skin>
          </head>
          <body>
            <b:section id='main'>
              <b:widget id='Blog1' type='Blog'>
                <b:includable id='main'/>
              </b:widget>
            </b:section>
          </body>
        </html>
      `;
      const diags = lintBloggerDocument(xml);
      const structDiags = diags.filter(d => d.code.startsWith('blogger.structure.'));
      expect(structDiags).toHaveLength(0);
    });

    it('does not demand <b:skin> or <b:section> when linting isolated snippet', () => {
      const xml = `<b:includable id='custom'><div>Content</div></b:includable>`;
      const diags = lintBloggerDocument(xml);
      expect(diags.some(d => d.code === 'blogger.structure.missing-skin')).toBe(false);
      expect(diags.some(d => d.code === 'blogger.structure.missing-section')).toBe(false);
    });
  });

  describe('iD uniqueness across template', () => {
    it('detects duplicate section IDs', () => {
      const xml = `
        <b:section id='main'></b:section>
        <b:section id='main'></b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const dupSection = diags.find(d => d.code === 'blogger.duplicate.section-id');
      expect(dupSection).toBeDefined();
    });

    it('detects duplicate widget IDs', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='Blog1' type='Blog'><b:includable id='main'/></b:widget>
          <b:widget id='Blog1' type='Blog'><b:includable id='main'/></b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const dupWidget = diags.find(d => d.code === 'blogger.duplicate.widget-id');
      expect(dupWidget).toBeDefined();
    });

    it('detects collisions between section ID and widget ID', () => {
      const xml = `
        <b:section id='sidebar'>
          <b:widget id='sidebar' type='HTML'><b:includable id='main'/></b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const collision = diags.find(d => d.code === 'blogger.collision.id');
      expect(collision).toBeDefined();
    });
  });

  describe('hierarchy and containment rules', () => {
    it('rejects nested <b:section>', () => {
      const xml = `
        <b:section id='parent'>
          <b:section id='child'></b:section>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const nested = diags.find(d => d.code === 'blogger.structure.nested-section');
      expect(nested).toBeDefined();
    });

    it('rejects orphan <b:widget> outside <b:section>', () => {
      const xml = `
        <div>
          <b:widget id='Blog1' type='Blog'><b:includable id='main'/></b:widget>
        </div>
      `;
      const diags = lintBloggerDocument(xml);
      const orphan = diags.find(d => d.code === 'blogger.structure.orphan-widget');
      expect(orphan).toBeDefined();
    });

    it('rejects direct HTML elements inside <b:section>', () => {
      const xml = `
        <b:section id='main'>
          <div class='wrapper'>
            <b:widget id='HTML1' type='HTML'><b:includable id='main'/></b:widget>
          </div>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidChild = diags.find(d => d.code === 'blogger.structure.invalid-section-child');
      expect(invalidChild).toBeDefined();
      expect(invalidChild?.message).toContain('<div>');
    });

    it('rejects direct HTML elements inside <b:widget> outside <b:includable>', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='HTML1' type='HTML'>
            <p>Direct text</p>
            <b:includable id='main'/>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidChild = diags.find(d => d.code === 'blogger.structure.invalid-widget-child');
      expect(invalidChild).toBeDefined();
    });

    it('allows <b:widget> without <b:includable id="main"> as compiler injects default inclusion', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='HTML1' type='HTML'>
            <b:includable id='custom'/>
          </b:widget>
          <b:widget id='HTML2' type='HTML'/>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const missingMain = diags.filter(d => d.code === 'blogger.structure.missing-main-includable');
      expect(missingMain).toHaveLength(0);
    });
  });

  describe('theme designer skin variables inside <b:skin> CDATA', () => {
    it('detects unclosed <Variable> and suggests self-closing delimiter />', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Accents" selector="selector">
            <Variable name="name" description="Accents" type="color" default="default" value="value">
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const selfCloseDiag = diags.find(d => d.code === 'blogger.syntax.self-closing-required' && d.message.includes('Variable'));
      expect(selfCloseDiag).toBeDefined();
      expect(selfCloseDiag?.quickFixes?.[0]?.newText).toBe('/>');
    });

    it('accepts properly closed <Variable .../> with valid core and type-specific attributes', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Accents" selector="selector">
            <Variable name="name" description="Accents" type="color" default="#333333" value="#333333"/>
            <Variable name="body.font" description="Body Font" type="font" family="Arial" size="14px" default="Arial" value="Arial"/>
            <Variable name="content.width" description="Width" type="length" min="600px" max="1200px" default="960px" value="960px"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const varDiags = diags.filter(d => d.code.startsWith('blogger.syntax.invalid-variable') || d.code.startsWith('blogger.missing.attribute'));
      expect(varDiags).toHaveLength(0);
    });

    it('rejects type-incompatible attributes on <Variable>', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Accents" selector="selector">
            <Variable name="test" description="Color" type="color" default="#fff" value="#fff" family="Arial"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidAttr = diags.find(d => d.code === 'blogger.syntax.invalid-variable-attribute');
      expect(invalidAttr).toBeDefined();
      expect(invalidAttr?.message).toContain('"family"');
      expect(invalidAttr?.message).toContain('"color"');
    });

    it('requires description on <Group> while selector is optional', () => {
      const xmlWithoutDesc = `
        <b:skin><![CDATA[
          <Group selector="selector">
            <Variable name="test" description="Color" type="color" default="#fff" value="#fff"/>
          </Group>
        ]]></b:skin>
      `;
      const diagsWithoutDesc = lintBloggerDocument(xmlWithoutDesc);
      const missingDesc = diagsWithoutDesc.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('description'));
      expect(missingDesc).toBeDefined();

      const xmlWithOnlyDesc = `
        <b:skin><![CDATA[
          <Group description="Accents">
            <Variable name="test" description="Color" type="color" default="#fff" value="#fff"/>
          </Group>
        ]]></b:skin>
      `;
      const diagsWithOnlyDesc = lintBloggerDocument(xmlWithOnlyDesc);
      const missingAttr = diagsWithOnlyDesc.find(d => d.code.startsWith('blogger.missing.attribute'));
      expect(missingAttr).toBeUndefined();
    });

    it('allows string type <Variable> without default and with empty value', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Admin">
            <Variable name="a.tools" description="Admin tools" type="string" value=""/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const varDiags = diags.filter(d =>
        d.code.startsWith('blogger.syntax.empty-attribute')
        || d.code.startsWith('blogger.missing.attribute'),
      );
      expect(varDiags).toHaveLength(0);
    });

    it('flags empty value and missing default on non-string skin variables', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Admin">
            <Variable name="theme.color" description="Theme color" type="color" value=""/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const emptyVal = diags.find(d => d.code === 'blogger.syntax.empty-attribute');
      const missingDefault = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"default"'));
      expect(emptyVal).toBeDefined();
      expect(missingDefault).toBeDefined();
    });
  });

  describe('b:defaultmarkup type validation', () => {
    it('accepts single valid widget type or Common/All', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type="Blog"/>
          <b:defaultmarkup type="Common"/>
          <b:defaultmarkup type="All"/>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const typeDiags = diags.filter(d =>
        d.code === 'blogger.syntax.invalid-defaultmarkup-type'
        || d.code === 'blogger.syntax.duplicate-defaultmarkup-type',
      );
      expect(typeDiags).toHaveLength(0);
    });

    it('accepts comma-separated widget types', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type="Blog,PopularPosts,FeaturedPost"/>
          <b:defaultmarkup type="Header, HTML"/>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const typeDiags = diags.filter(d =>
        d.code === 'blogger.syntax.invalid-defaultmarkup-type'
        || d.code === 'blogger.syntax.duplicate-defaultmarkup-type',
      );
      expect(typeDiags).toHaveLength(0);
    });

    it('rejects duplicate types in comma-separated list', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type="Blog,Blog,FeaturedPost"/>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const dupDiag = diags.find(d => d.code === 'blogger.syntax.duplicate-defaultmarkup-type');
      expect(dupDiag).toBeDefined();
      expect(dupDiag?.message).toContain('"Blog"');
    });

    it('rejects invalid types in comma-separated list', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type="Blog,UnknownWidget,FeaturedPost"/>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const invalidDiag = diags.find(d => d.code === 'blogger.syntax.invalid-defaultmarkup-type');
      expect(invalidDiag).toBeDefined();
      expect(invalidDiag?.message).toContain('"UnknownWidget"');
    });
  });

  describe('horatio semantic rules: lambdas and parameterized messages', () => {
    it('warns about data: prefix inside lambda predicates and offers quick fix', () => {
      const xml = `<b:eval expr='data:posts filter (p => data:p.title != "")'/>`;
      const diags = lintBloggerDocument(xml);
      const lambdaDiag = diags.find(d => d.code === 'blogger.syntax.lambda-data-prefix');
      expect(lambdaDiag).toBeDefined();
      expect(lambdaDiag?.quickFixes?.[0]?.newText).toBe('p.title');
    });

    it('flags direct invocation of parameterized messages', () => {
      const xml = `<data:messages.numberOfComments/>`;
      const diags = lintBloggerDocument(xml);
      const msgDiag = diags.find(d => d.code === 'blogger.syntax.parameterized-message-invocation');
      expect(msgDiag).toBeDefined();
      expect(msgDiag?.message).toContain('messages.numberOfComments');
    });
  });
});
