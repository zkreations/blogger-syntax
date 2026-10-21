import { describe, expect, it } from 'vitest';
import { lintBloggerDocument } from '../../src/core/linter/linterEngine.js';

describe('linter contracts & horatio specifications', () => {
  describe('mandatory attributes on directives', () => {
    it('detects missing id on <b:section>', () => {
      const xml = `<b:section></b:section>`;
      const diags = lintBloggerDocument(xml);
      const missingId = diags.find(d => d.code === 'BX1022' && d.message.includes('id'));
      expect(missingId).toBeDefined();
    });

    it('detects empty id on <b:section>', () => {
      const xml = `<b:section id=''></b:section>`;
      const diags = lintBloggerDocument(xml);
      const emptyId = diags.find(d => d.code === 'BX1039' && d.message.includes('id'));
      expect(emptyId).toBeDefined();
    });

    it('detects missing id and type on <b:widget>', () => {
      const xml = `<b:section id='main'><b:widget></b:widget></b:section>`;
      const diags = lintBloggerDocument(xml);

      expect(diags.some(d => d.code === 'BX1022' && d.message.includes('id'))).toBe(true);
      expect(diags.some(d => d.code === 'BX1022' && d.message.includes('type'))).toBe(true);
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
      const emptyDiags = diags.filter(d => d.code === 'BX1039');
      expect(emptyDiags).toHaveLength(0);
    });

    it('rejects empty name attribute on <b:attr>', () => {
      const xml = `<b:attr name="" value="1"/>`;
      const diags = lintBloggerDocument(xml);
      const emptyNameDiag = diags.find(d => d.code === 'BX1039' && d.message.includes('name'));
      expect(emptyNameDiag).toBeDefined();
    });

    it('detects missing required attributes on <b:loop> and <b:with>', () => {
      const xml = `
        <b:loop>
          <b:with/>
        </b:loop>
      `;
      const diags = lintBloggerDocument(xml);
      expect(diags.some(d => d.code === 'BX1022' && d.message.includes('b:loop'))).toBe(true);
      expect(diags.some(d => d.code === 'BX1022' && d.message.includes('b:with'))).toBe(true);
    });
  });

  describe('strict widget and directive attribute constraints', () => {
    it('accepts valid widgets inside section', () => {
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
      const errDiags = diags.filter(d => d.severity === 'error');
      expect(errDiags).toHaveLength(0);
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
      const unknownType = diags.find(d => d.message.includes('Custom'));
      expect(unknownType).toBeDefined();
    });

    it('prohibits expr: on static-only attributes like id', () => {
      const xml = `<b:section expr:id='data:blog.id'></b:section>`;
      const diags = lintBloggerDocument(xml);
      const dynamicAttr = diags.find(d => d.code === 'BX1042');
      expect(dynamicAttr).toBeDefined();
    });
  });

  describe('iD uniqueness across template', () => {
    it('detects duplicate section IDs', () => {
      const xml = `
        <b:section id='main'></b:section>
        <b:section id='main'></b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const dupSection = diags.find(d => d.code === 'BX1033');
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
      const dupWidget = diags.find(d => d.code === 'BX1033');
      expect(dupWidget).toBeDefined();
    });

    it('detects collisions between section ID and widget ID', () => {
      const xml = `
        <b:section id='sidebar'>
          <b:widget id='sidebar' type='HTML'><b:includable id='main'/></b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const collision = diags.find(d => d.code === 'BX1033');
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
      const nested = diags.find(d => d.code === 'BX1035' || d.code === 'BX1023');
      expect(nested).toBeDefined();
    });

    it('rejects orphan <b:widget> outside <b:section>', () => {
      const xml = `
        <div>
          <b:widget id='Blog1' type='Blog'><b:includable id='main'/></b:widget>
        </div>
      `;
      const diags = lintBloggerDocument(xml);
      const orphan = diags.find(d => d.code === 'BX1034');
      expect(orphan).toBeDefined();
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
      const errors = diags.filter(d => d.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });

  describe('theme designer skin variables inside <b:skin> CDATA', () => {
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
      const varDiags = diags.filter(d => d.code === 'BX1040');
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
      const invalidAttr = diags.find(d => d.code === 'BX1040');
      expect(invalidAttr).toBeDefined();
      expect(invalidAttr?.message).toContain('family');
      expect(invalidAttr?.message).toContain('color');
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
      const varDiags = diags.filter(d => d.code === 'BX1040');
      expect(varDiags).toHaveLength(0);
      expect(diags.filter(d => d.code === 'BX1039')).toHaveLength(0);
    });

    it('rejects empty value on non-string type <Variable> with BX1039', () => {
      const xml = `
        <b:skin><![CDATA[
          <Group description="Admin">
            <Variable name="a.color" description="Admin color" type="color" value=""/>
          </Group>
        ]]></b:skin>
      `;
      const diags = lintBloggerDocument(xml);
      const emptyDiag = diags.find(d => d.code === 'BX1039');
      expect(emptyDiag).toBeDefined();
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
      const errDiags = diags.filter(d => d.severity === 'error');
      expect(errDiags).toHaveLength(0);
    });

    it('accepts valid widget types without error', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type="Blog"/>
          <b:defaultmarkup type="Header"/>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const errDiags = diags.filter(d => d.severity === 'error');
      expect(errDiags).toHaveLength(0);
    });
  });

  describe('horatio semantic rules: lambdas and parameterized messages', () => {
    it('warns about data: prefix inside lambda predicates and offers quick fix', () => {
      const xml = `<b:eval expr='data:posts filter (p => data:p.title != "")'/>`;
      const diags = lintBloggerDocument(xml);
      const lambdaDiag = diags.find(d => d.code === 'BX1019');
      expect(lambdaDiag).toBeDefined();
      expect(lambdaDiag?.message).toContain('data:');
    });
  });

  describe('static and dynamic boolean attributes validation', () => {
    describe('static boolean attributes acceptance ("true", "false", "yes", "no")', () => {
      it.each(['true', 'false', 'yes', 'no', 'TRUE', 'False', 'YES', 'No'])(
        'accepts "%s" for <b:section showaddelement="...">',
        (val) => {
          const xml = `<b:section id='main' showaddelement='${val}'/>`;
          const diags = lintBloggerDocument(xml);
          const boolDiags = diags.filter(d => d.code === 'BX1024' && d.message.includes('showaddelement'));
          expect(boolDiags).toHaveLength(0);
        },
      );
    });

    describe('static boolean attributes rejection of invalid values', () => {
      it('rejects invalid static value on showaddelement', () => {
        const xml = `<b:section id='main' showaddelement='invalidVal'/>`;
        const diags = lintBloggerDocument(xml);
        const boolDiag = diags.find(d => (d.code === 'BX1043' || d.code === 'BX1024') && d.message.includes('showaddelement'));
        expect(boolDiag).toBeDefined();
      });
    });

    describe('context differentiation: expressions vs attributes', () => {
      it('flags quoted boolean in expression (BX1038)', () => {
        const xml = `<b:eval expr='data:view.isPost == "true"'/>`;
        const diags = lintBloggerDocument(xml);
        const boolDiag = diags.find(d => d.code === 'BX1038');
        expect(boolDiag).toBeDefined();
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
      const attrDiags = diags.filter(d => d.code === 'BX1042');
      expect(attrDiags).toHaveLength(0);
    });

    it('allows arbitrary static and dynamic attributes on <b:tag>', () => {
      const xml = `
        <b:tag expr:name='data:view.isPost ? "article" : "div"' expr:class='data:post.labels' expr:id='data:post.id' custom-attr='test'>
          Content
        </b:tag>
      `;
      const diags = lintBloggerDocument(xml);
      const tagDiags = diags.filter(d => d.code === 'BX1042');
      expect(tagDiags).toHaveLength(0);
    });

    it('satisfies mandatory attributes when dynamic expr: variant is used', () => {
      const xml = `
        <b:with expr:value='data:post.title' var='title'>
          <b:include expr:name='"subroutine"'/>
        </b:with>
      `;
      const diags = lintBloggerDocument(xml);
      const missingDiags = diags.filter(d => d.code === 'BX1022');
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
      const dynamicErrors = diags.filter(d => d.code === 'BX1042');
      expect(dynamicErrors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('data:widget lexical scope delimitation and canonical properties contract', () => {
    it('accepts data:widget inside <b:includable> descendant of <b:widget>', () => {
      const xml = `
        <b:section id='main'>
          <b:widget id='Blog1' type='Blog'>
            <b:includable id='main'>
              <data:widget.instanceId/>
              <data:widget.sectionId/>
              <data:widget.type/>
              <data:widget.version/>
              <b:eval expr='data:widget.instanceId'/>
              <b:eval expr='data:widget.type'/>
              <b:eval expr='data:widget'/>
            </b:includable>
          </b:widget>
        </b:section>
      `;
      const diags = lintBloggerDocument(xml);
      const errors = diags.filter(d => d.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('accepts data:widget inside <b:includable> descendant of <b:defaultmarkup> (zero false positives)', () => {
      const xml = `
        <b:defaultmarkups>
          <b:defaultmarkup type='Blog'>
            <b:includable id='main'>
              <data:widget.instanceId/>
              <data:widget.sectionId/>
              <data:widget.type/>
              <data:widget.version/>
              <b:eval expr='data:widget.type'/>
            </b:includable>
          </b:defaultmarkup>
        </b:defaultmarkups>
      `;
      const diags = lintBloggerDocument(xml);
      const errors = diags.filter(d => d.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });
});
