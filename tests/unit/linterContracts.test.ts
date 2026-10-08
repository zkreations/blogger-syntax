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

    it('allows empty value attribute on <b:attr> to support attribute removal', () => {
      const xml = `<b:attr name="data-version" value=""/>`;
      const diags = lintBloggerDocument(xml);
      const emptyDiags = diags.filter(d => d.code === 'blogger.syntax.empty-attribute');
      expect(emptyDiags).toHaveLength(0);
    });

    it('rejects empty name attribute on <b:attr>', () => {
      const xml = `<b:attr name="" value="1"/>`;
      const diags = lintBloggerDocument(xml);
      const emptyNameDiag = diags.find(d => d.code === 'blogger.syntax.empty-attribute' && d.message.includes('"name"'));
      expect(emptyNameDiag).toBeDefined();
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

    it('rejects empty default attribute on non-string skin variables', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Admin">
            <Variable name="theme.color" description="Theme color" type="color" default="" value="#fff"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const emptyDefault = diags.find(d => d.code === 'blogger.syntax.empty-attribute' && d.message.includes('"default"'));
      expect(emptyDefault).toBeDefined();
    });

    it('supports optional hideEditor across all variable types without unknown attribute errors', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Theme Settings">
            <Variable name="v.color" description="Color" type="color" default="#fff" value="#fff" hideEditor="true"/>
            <Variable name="v.font" description="Font" type="font" default="12px Arial" value="12px Arial" hideEditor="false"/>
            <Variable name="v.length" description="Width" type="length" default="100px" value="100px" hideEditor="true"/>
            <Variable name="v.bg" description="BG" type="background" default="none" value="none" hideEditor="false"/>
            <Variable name="v.str" description="Text" type="string" value="hello" hideEditor="true"/>
            <Variable name="v.url" description="Link" type="url" default="https://example.com" value="https://example.com" hideEditor="false"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags).toHaveLength(0);
    });

    it('validates that hideEditor rejects non-boolean values (e.g. "none" or "1")', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Theme Settings">
            <Variable name="v.str" description="Text" type="string" value="hello" hideEditor="none"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const boolDiag = diags.find(d => d.code === 'blogger.syntax.invalid-boolean-attribute');
      expect(boolDiag).toBeDefined();
      expect(boolDiag?.message).toContain('hideEditor');
    });

    it('requires name, description, type, and value on string variables when omitted', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Theme Settings">
            <Variable type="string"/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const missingName = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"name"'));
      const missingDesc = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"description"'));
      const missingValue = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"value"'));
      const missingDefault = diags.find(d => d.code === 'blogger.missing.attribute' && d.message.includes('"default"'));

      expect(missingName).toBeDefined();
      expect(missingDesc).toBeDefined();
      expect(missingValue).toBeDefined();
      expect(missingDefault).toBeUndefined(); // default is optional for string
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

  describe('static and dynamic boolean attributes validation', () => {
    describe('static boolean attributes acceptance ("true", "false", "yes", "no")', () => {
      it.each(['true', 'false', 'yes', 'no', 'TRUE', 'False', 'YES', 'No'])(
        'accepts "%s" for <b:section showaddelement="...">',
        (val) => {
          const xml = `<b:section id='main' showaddelement='${val}'/>`;
          const diags = lintBloggerDocument(xml);
          const boolDiags = diags.filter(d =>
            d.code === 'blogger.syntax.invalid-boolean-attribute'
            || d.code === 'blogger.syntax.invalid-yes-no-attribute'
            || d.code === 'blogger.syntax.unquoted-attribute',
          );
          expect(boolDiags).toHaveLength(0);
        },
      );

      it.each(['true', 'false', 'yes', 'no', 'TRUE', 'False', 'YES', 'No'])(
        'accepts "%s" for <b:widget locked="...">',
        (val) => {
          const xml = `
            <b:section id='main'>
              <b:widget id='HTML1' type='HTML' locked='${val}'>
                <b:includable id='main'/>
              </b:widget>
            </b:section>
          `;
          const diags = lintBloggerDocument(xml);
          const boolDiags = diags.filter(d =>
            d.code === 'blogger.syntax.invalid-boolean-attribute'
            || d.code === 'blogger.syntax.unquoted-attribute',
          );
          expect(boolDiags).toHaveLength(0);
        },
      );

      it.each(['true', 'false', 'yes', 'no', 'TRUE', 'False', 'YES', 'No'])(
        'accepts "%s" for <b:section preferred="...">',
        (val) => {
          const xml = `<b:section id='main' preferred='${val}'/>`;
          const diags = lintBloggerDocument(xml);
          const boolDiags = diags.filter(d =>
            d.code === 'blogger.syntax.invalid-boolean-attribute'
            || d.code === 'blogger.syntax.invalid-yes-no-attribute'
            || d.code === 'blogger.syntax.unquoted-attribute',
          );
          expect(boolDiags).toHaveLength(0);
        },
      );

      it.each(['true', 'false', 'yes', 'no'])(
        'accepts "%s" for ads, visible, reverse, and hideEditor',
        (val) => {
          const xml = `
            <b:section id='main' ads='${val}'>
              <b:widget id='HTML1' type='HTML' visible='${val}'>
                <b:includable id='main'>
                  <b:loop values='data:posts' var='post' reverse='${val}'/>
                </b:includable>
              </b:widget>
            </b:section>
            <b:skin><![CDATA[
              <Variable name="v.str" description="Text" type="string" value="hello" hideEditor="${val}"/>
            ]]></b:skin>
          `;
          const diags = lintBloggerDocument(xml);
          const boolDiags = diags.filter(d =>
            d.code === 'blogger.syntax.invalid-boolean-attribute'
            || d.code === 'blogger.syntax.unquoted-attribute',
          );
          expect(boolDiags).toHaveLength(0);
        },
      );
    });

    describe('static boolean attributes rejection of invalid values', () => {
      it('rejects "1", "0", and "none" on static boolean attributes with errors', () => {
        const xml = `
          <b:section id='main' showaddelement='1' preferred='0' ads='none'>
            <b:widget id='HTML1' type='HTML' locked='1' visible='none'>
              <b:includable id='main'>
                <b:loop values='data:posts' var='p' reverse='0'/>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const boolErrors = diags.filter(d => d.code === 'blogger.syntax.invalid-boolean-attribute');
        expect(boolErrors).toHaveLength(6);
        expect(boolErrors.every(d => d.severity === 'error')).toBe(true);
      });

      it('preserves documented attribute variants such as mobile="only"', () => {
        const xml = `
          <b:section id='main' mobile='only'>
            <b:widget id='HTML1' type='HTML' mobile='only'>
              <b:includable id='main'/>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const boolErrors = diags.filter(d => d.code === 'blogger.syntax.invalid-boolean-attribute');
        expect(boolErrors).toHaveLength(0);
      });

      it('enforces XML quote delimiters on static boolean attributes', () => {
        const xml = `<b:section id='main' showaddelement=false/>`;
        const diags = lintBloggerDocument(xml);
        const unquoted = diags.find(d => d.code === 'blogger.syntax.unquoted-attribute');
        expect(unquoted).toBeDefined();
        expect(unquoted?.severity).toBe('error');
        expect(unquoted?.message).toContain('must be enclosed in quotes in XML');
      });

      it('prohibits dynamic expr: prefix on showaddelement, locked, preferred, and ads', () => {
        const xml = `
          <b:section id='main' expr:showaddelement='data:canAdd' expr:preferred='data:pref' expr:ads='data:hasAds'>
            <b:widget id='HTML1' type='HTML' expr:locked='data:isLocked'>
              <b:includable id='main'/>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const dynamicErrors = diags.filter(d => d.code === 'blogger.syntax.invalid-dynamic-attribute');
        expect(dynamicErrors).toHaveLength(4);
        expect(dynamicErrors.some(d => d.message.includes('"expr:showaddelement"'))).toBe(true);
        expect(dynamicErrors.some(d => d.message.includes('"expr:locked"'))).toBe(true);
        expect(dynamicErrors.some(d => d.message.includes('"expr:preferred"'))).toBe(true);
        expect(dynamicErrors.some(d => d.message.includes('"expr:ads"'))).toBe(true);
      });
    });

    describe('context differentiation: expressions vs attributes', () => {
      it('accepts unquoted boolean literals inside dynamic expressions', () => {
        const xml = `
          <b:if cond='true and not false'>
            <b:with var='flag' value='false'>
              <b:eval expr='true'/>
            </b:with>
          </b:if>
        `;
        const diags = lintBloggerDocument(xml);
        const quotedExprWarnings = diags.filter(d => d.code === 'blogger.syntax.quoted-boolean-in-expression');
        expect(quotedExprWarnings).toHaveLength(0);
      });

      it('warns about quoted boolean strings inside expressions and offers unquoted quick fixes', () => {
        const xml = `
          <b:if cond='"false"'>
            <b:with var='flag' value='"false"'>
              <b:eval expr='data:isDraft ? "true" : "false"'/>
            </b:with>
          </b:if>
        `;
        const diags = lintBloggerDocument(xml);
        const quotedExprWarnings = diags.filter(d => d.code === 'blogger.syntax.quoted-boolean-in-expression');
        expect(quotedExprWarnings).toHaveLength(4);
        expect(quotedExprWarnings.every(d => d.severity === 'warning')).toBe(true);
        expect(quotedExprWarnings[0]?.message).toContain('evaluates as truthy');
        expect(quotedExprWarnings[0]?.quickFixes?.[0]?.newText).toBe('false');
      });

      it('warns about single-quoted boolean strings inside expressions and in expr:* attributes', () => {
        const xml = `
          <b:if cond="'true'">
            <div expr:class='"false"'></div>
          </b:if>
        `;
        const diags = lintBloggerDocument(xml);
        const quotedExprWarnings = diags.filter(d => d.code === 'blogger.syntax.quoted-boolean-in-expression');
        expect(quotedExprWarnings).toHaveLength(2);
        expect(quotedExprWarnings[0]?.quickFixes?.[0]?.newText).toBe('true');
        expect(quotedExprWarnings[1]?.quickFixes?.[0]?.newText).toBe('false');
      });
    });

    describe('reportAbuse widget support & validation rules', () => {
      it('validates official ReportAbuse widget with version 1 and 2', () => {
        const xmlV1 = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse' version='1'>
              <b:includable id='main'>
                <p>Report</p>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diagsV1 = lintBloggerDocument(xmlV1);
        expect(diagsV1).toHaveLength(0);

        const xmlV2 = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse' version='2'>
              <b:includable id='main'>
                <p>Report</p>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diagsV2 = lintBloggerDocument(xmlV2);
        expect(diagsV2).toHaveLength(0);
      });

      it('allows b:defaultmarkup type="ReportAbuse"', () => {
        const xml = `
          <b:defaultmarkups>
            <b:defaultmarkup type='ReportAbuse'>
              <b:includable id='main'/>
            </b:defaultmarkup>
          </b:defaultmarkups>
        `;
        const diags = lintBloggerDocument(xml);
        expect(diags).toHaveLength(0);
      });

      it('rejects widget ID prefix not matching ReportAbuse', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='Abuse1' type='ReportAbuse'>
              <b:includable id='main'/>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const invalidId = diags.find(d => d.code === 'blogger.syntax.invalid-widget-id');
        expect(invalidId).toBeDefined();
        expect(invalidId?.message).toContain('ReportAbuse');
      });

      it('enforces cardinality: maximum 1 ReportAbuse instance across the template', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:includable id='main'/>
            </b:widget>
            <b:widget id='ReportAbuse2' type='ReportAbuse'>
              <b:includable id='main'/>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const cardDiags = diags.filter(d => d.code === 'blogger.widget.cardinality-exceeded');
        expect(cardDiags).toHaveLength(1);
        expect(cardDiags[0]?.message).toContain('Only 1 instance of the "ReportAbuse" widget is permitted');
      });

      it('prohibits <b:widget-settings> inside ReportAbuse widget', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:widget-settings>
                <b:widget-setting name='style.layout'>1</b:widget-setting>
              </b:widget-settings>
              <b:includable id='main'/>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const settingsDiag = diags.find(d => d.code === 'blogger.widget.prohibited-settings');
        expect(settingsDiag).toBeDefined();
        expect(settingsDiag?.message).toContain('<b:widget-settings> is prohibited in "ReportAbuse" widget');
      });

      it('flags non-existent local data properties (e.g. data:abuseUrl, data:link, <data:abuseUrl/>)', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:includable id='main'>
                <data:abuseUrl/>
                <b:eval expr='data:link'/>
                <a expr:href='data:abuseUrl'>Report</a>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const hallocDiags = diags.filter(d => d.code === 'blogger.hallucination.data-property');
        expect(hallocDiags).toHaveLength(3);
        expect(hallocDiags.every(d => d.message.includes('ReportAbuse'))).toBe(true);
      });

      it('allows universal data:widget.* properties (id, type, sectionId, instanceId, version)', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:includable id='main'>
                <data:widget.id/>
                <b:eval expr='data:widget.type'/>
                <b:eval expr='data:widget.sectionId'/>
                <b:eval expr='data:widget.instanceId'/>
                <b:eval expr='data:widget.version'/>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const hallocDiags = diags.filter(d => d.code === 'blogger.hallucination.data-property');
        expect(hallocDiags).toHaveLength(0);
      });

      it('flags unknown data:widget.* properties inside ReportAbuse', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:includable id='main'>
                <data:widget.abuseUrl/>
                <b:eval expr='data:widget.customField'/>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const hallocDiags = diags.filter(d => d.code === 'blogger.hallucination.data-property');
        expect(hallocDiags).toHaveLength(2);
        expect(hallocDiags[0]?.message).toContain('data:widget.abuseUrl');
        expect(hallocDiags[1]?.message).toContain('data:widget.customField');
      });

      it('allows global roots and template scoped variables inside ReportAbuse', () => {
        const xml = `
          <b:section id='main'>
            <b:widget id='ReportAbuse1' type='ReportAbuse'>
              <b:includable id='main'>
                <b:eval expr='data:blog.title'/>
                <b:eval expr='data:view.url'/>
                <b:eval expr='data:messages.reportAbuse'/>
                <b:with var='customUrl' value='data:blog.homepageUrl'>
                  <b:eval expr='data:customUrl'/>
                </b:with>
                <b:loop values='data:widgets.ReportAbuse' var='ra'>
                  <b:eval expr='data:ra.id'/>
                </b:loop>
              </b:includable>
            </b:widget>
          </b:section>
        `;
        const diags = lintBloggerDocument(xml);
        const hallocDiags = diags.filter(d => d.code === 'blogger.hallucination.data-property');
        expect(hallocDiags).toHaveLength(0);
      });
    });
  });

  describe('dynamic attribute validation and expr: prefix handling (Horatio catalog rules)', () => {
    it('allows valid dynamic expr: attributes on <b:loop> without false positives', () => {
      const xml = `
        <b:loop expr:values='data:posts' var='post' expr:index='i' expr:reverse='data:blog.isMobileRequest'>
          <b:eval expr='data:post.title'/>
        </b:loop>
      `;
      const diags = lintBloggerDocument(xml);
      const attrDiags = diags.filter(d =>
        d.code === 'blogger.syntax.invalid-dynamic-attribute'
        || d.code === 'blogger.unrecognized.attribute'
        || d.code === 'blogger.missing.attribute',
      );
      expect(attrDiags).toHaveLength(0);
    });

    it('allows arbitrary static and dynamic attributes on <b:tag>', () => {
      const xml = `
        <b:tag expr:name='data:view.isPost ? "article" : "div"' expr:class='data:post.labels' expr:id='data:post.id' custom-attr='test'>
          Content
        </b:tag>
      `;
      const diags = lintBloggerDocument(xml);
      const tagDiags = diags.filter(d =>
        d.code === 'blogger.syntax.invalid-dynamic-attribute'
        || d.code === 'blogger.unrecognized.attribute'
        || d.code === 'blogger.missing.attribute',
      );
      expect(tagDiags).toHaveLength(0);
    });

    it('satisfies mandatory attributes when dynamic expr: variant is used', () => {
      const xml = `
        <b:with expr:value='data:post.title' var='title'>
          <b:include expr:name='"subroutine"'/>
        </b:with>
      `;
      const diags = lintBloggerDocument(xml);
      const missingDiags = diags.filter(d => d.code === 'blogger.missing.attribute');
      expect(missingDiags).toHaveLength(0);
    });

    it('flags invalid dynamic attributes when base attribute has expr: false', () => {
      const xml = `
        <b:section id='main'>
          <b:widget expr:id='data:id' type='HTML' expr:title='data:title'>
            <b:includable expr:id='main'/>
          </b:widget>
        </b:section>
        <b:eval expr:expr='data:post.title'/>
        <b:template-script expr:name='indie'/>
        <b:defaultmarkup expr:type='Common'/>
        <b:widget-setting expr:name='foo'/>
        <b:param expr:name='p' value='val'/>
      `;
      const diags = lintBloggerDocument(xml);
      const dynamicErrors = diags.filter(d => d.code === 'blogger.syntax.invalid-dynamic-attribute');
      expect(dynamicErrors.length).toBeGreaterThanOrEqual(7);
      expect(dynamicErrors.some(d => d.message.includes('"expr:id"') && d.message.includes('<b:widget>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:title"') && d.message.includes('<b:widget>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:id"') && d.message.includes('<b:includable>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:expr"') && d.message.includes('<b:eval>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:name"') && d.message.includes('<b:template-script>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:type"') && d.message.includes('<b:defaultmarkup>'))).toBe(true);
      expect(dynamicErrors.some(d => d.message.includes('"expr:name"') && d.message.includes('<b:param>'))).toBe(true);
    });

    it('flags unrecognized attributes on tags when base attribute does not exist', () => {
      const xml = `
        <b:loop values='data:posts' var='post' expr:nonExistentAttr='true'/>
      `;
      const diags = lintBloggerDocument(xml);
      const unrec = diags.find(d => d.code === 'blogger.unrecognized.attribute');
      expect(unrec).toBeDefined();
      expect(unrec?.message).toContain('expr:nonExistentAttr');
    });
  });
});
