import { describe, expect, it } from 'vitest';
import { navigatePropertyPath } from '../../src/core/resolver/dataPathAdapter.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { buildSkinVariableProperties, extractSkinVariables } from '../../src/core/resolver/skinVariableResolver.js';
import { TemplateLanguageService } from '../../src/core/service/templateLanguageService.js';

const EMPIRICAL_TEMPLATE = `
<b:skin><![CDATA[
<Variable name="name" description="Name" type="string" value="Daniel"/>
<Variable name="admin.name" description="Admin Name" type="string" value="Abel"/>

<Group description="Accents">
  <Variable name="primary" description="Accents" type="color" default="#fff" value="#fff"/>
  <Variable name="fuente" description="Roboto Bold 22" type="font"
    default="bold 22px Roboto, sans-serif" hideEditor="true"
    value="bold 22px Roboto, sans-serif"/>
</Group>
]]></b:skin>

<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <data:skin.vars.name/>
    <data:skin.vars.admin_name/>
    <data:skin.vars.primary.red/>
    <data:skin.vars.fuente/>
    <data:skin.vars.fuente.family/>
  </b:includable>
</b:widget>
`;

describe('theme Designer Skin Variables (data:skin.vars.*)', () => {
  describe('extraction and Property Modeling', () => {
    it('should extract all declared variables from b:skin CDATA', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);

      expect(symbols.name).toBeDefined();
      expect(symbols.name?.type).toBe('string');
      expect(symbols.name?.description).toBe('Name');

      // Dots must normalize to underscores as symbol key
      expect(symbols.admin_name).toBeDefined();
      expect(symbols.admin_name?.name).toBe('admin.name');
      expect(symbols.admin_name?.type).toBe('string');
      expect(symbols.admin_name?.description).toBe('Admin Name');

      expect(symbols.primary).toBeDefined();
      expect(symbols.primary?.type).toBe('color');

      expect(symbols.fuente).toBeDefined();
      expect(symbols.fuente?.type).toBe('font');
      expect(symbols.fuente?.description).toBe('Roboto Bold 22');

      // Undeclared variable must not exist
      expect(symbols.otracosa).toBeUndefined();
    });

    it('should build BloggerProperties with type-specific modifiers', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const props = buildSkinVariableProperties(symbols);

      // String variables have no sub-properties/children
      expect(props.name?.children).toBeUndefined();
      expect(props.admin_name?.children).toBeUndefined();

      // Color variable has color modifiers
      expect(props.primary?.children).toBeDefined();
      const colorChildren = Object.keys(props.primary!.children!);
      expect(colorChildren).toContain('red');
      expect(colorChildren).toContain('green');
      expect(colorChildren).toContain('blue');
      expect(colorChildren).toContain('alpha');
      expect(colorChildren).toContain('transparent');
      expect(colorChildren).toContain('inverse');

      // Font variable has font modifiers
      expect(props.fuente?.children).toBeDefined();
      const fontChildren = Object.keys(props.fuente!.children!);
      expect(fontChildren).toContain('family');
      expect(fontChildren).toContain('size');

      // Descriptions and examples
      expect(props.admin_name?.description).toContain('Admin Name');
      expect(props.admin_name?.description).toContain('**Value:** `Abel`');
      expect(props.primary?.description).toContain('**Default:** `#fff`');
      expect(props.primary?.description).toContain('**Value:** `#fff`');
      expect(props.fuente?.children?.family?.example).toBe('data:skin.vars.body_font.family');
      expect(props.primary?.children?.red?.example).toBe('data:skin.vars.keycolor.red');
    });
  });

  describe('property Hierarchy Navigation', () => {
    it('should navigate data:skin.vars and return all declared variables as children', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const nav = navigatePropertyPath(['skin', 'vars'], undefined, undefined, skinProps);
      expect(nav).toBeDefined();
      expect(nav?.target?.name).toBe('vars');
      expect(nav?.children).toBeDefined();

      const childNames = Object.keys(nav!.children!);
      expect(childNames).toContain('name');
      expect(childNames).toContain('admin_name');
      expect(childNames).toContain('primary');
      expect(childNames).toContain('fuente');
      expect(childNames).not.toContain('otracosa');
    });

    it('should navigate font modifiers via data:skin.vars.fuente', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const nav = navigatePropertyPath(['skin', 'vars', 'fuente'], undefined, undefined, skinProps);
      expect(nav).toBeDefined();
      expect(nav?.target?.name).toBe('fuente');
      expect(Object.keys(nav!.children!)).toEqual(['family', 'size']);
    });

    it('should navigate color modifiers via data:skin.vars.primary', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const nav = navigatePropertyPath(['skin', 'vars', 'primary'], undefined, undefined, skinProps);
      expect(nav).toBeDefined();
      expect(nav?.target?.name).toBe('primary');
      const children = Object.keys(nav!.children!);
      expect(children).toContain('red');
      expect(children).toContain('green');
      expect(children).toContain('blue');
    });

    it('should fail navigation for undeclared variable (data:skin.vars.otracosa)', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const nav = navigatePropertyPath(['skin', 'vars', 'otracosa'], undefined, undefined, skinProps);
      expect(nav).toBeUndefined();
    });
  });

  describe('path Resolver Autocomplete Suggestions', () => {
    const resolver = new BloggerPathResolver();

    it('should suggest declared skin variables for data:skin.vars.', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const suggestions = resolver.resolveDataPath(['skin', 'vars'], undefined, undefined, skinProps);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('name');
      expect(names).toContain('admin_name');
      expect(names).toContain('primary');
      expect(names).toContain('fuente');
      expect(names).not.toContain('otracosa');

      const adminSug = suggestions.find(s => s.name === 'admin_name');
      expect(adminSug?.kind).toBe('variable');
      expect(adminSug?.categoryBadge).toBe('Theme');
    });

    it('should suggest font sub-properties for data:skin.vars.fuente.', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const suggestions = resolver.resolveDataPath(['skin', 'vars', 'fuente'], undefined, undefined, skinProps);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['family', 'size']);
      const familySug = suggestions.find(s => s.name === 'family');
      expect(familySug?.type).toBe('string');
      expect(familySug?.description).toContain('Font family');
    });

    it('should suggest color sub-properties for data:skin.vars.primary.', () => {
      const symbols = extractSkinVariables(EMPIRICAL_TEMPLATE);
      const skinProps = buildSkinVariableProperties(symbols);

      const suggestions = resolver.resolveDataPath(['skin', 'vars', 'primary'], undefined, undefined, skinProps);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('red');
      expect(names).toContain('green');
      expect(names).toContain('blue');
      expect(names).toContain('alpha');
      expect(names).toContain('transparent');
      expect(names).toContain('inverse');
    });
  });

  describe('language Service End-to-End Integration', () => {
    const service = new TemplateLanguageService();

    it('should autocomplete data:skin.vars. inside widget template', () => {
      const doc = `${EMPIRICAL_TEMPLATE}\n<b:eval expr='data:skin.vars.`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'test.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('name');
      expect(names).toContain('admin_name');
      expect(names).toContain('primary');
      expect(names).toContain('fuente');
      expect(names).not.toContain('otracosa');
    });

    it('should autocomplete font modifiers at data:skin.vars.fuente.', () => {
      const doc = `${EMPIRICAL_TEMPLATE}\n<data:skin.vars.fuente.`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'test.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('family');
      expect(names).toContain('size');
    });

    it('should provide hover information for data:skin.vars.admin_name', () => {
      const doc = EMPIRICAL_TEMPLATE;
      const targetStr = 'data:skin.vars.admin_name';
      const offset = doc.indexOf(targetStr) + 5;

      const hoverResult = service.getHover(doc, offset, { docKey: 'test.xml', version: 1 });
      expect(hoverResult).toBeDefined();
      expect(hoverResult?.hover.title).toBe('data:skin.vars.admin_name');
      expect(hoverResult?.hover.description).toContain('Admin Name');
      expect(hoverResult?.hover.description).toContain('**Value:** `Abel`');
    });

    it('should provide hover information with default and value for data:skin.vars.primary', () => {
      const doc = `${EMPIRICAL_TEMPLATE}\n<data:skin.vars.primary/>`;
      const targetStr = 'data:skin.vars.primary';
      const offset = doc.lastIndexOf(targetStr) + 5;

      const hoverResult = service.getHover(doc, offset, { docKey: 'primary_hover.xml', version: 1 });
      expect(hoverResult).toBeDefined();
      expect(hoverResult?.hover.title).toBe('data:skin.vars.primary');
      expect(hoverResult?.hover.description).toContain('Accents');
      expect(hoverResult?.hover.description).toContain('**Default:** `#fff`');
      expect(hoverResult?.hover.description).toContain('**Value:** `#fff`');
    });

    it('should provide hover information for font modifier data:skin.vars.fuente.family', () => {
      const doc = EMPIRICAL_TEMPLATE;
      const targetStr = 'data:skin.vars.fuente.family';
      const offset = doc.indexOf(targetStr) + 5;

      const hoverResult = service.getHover(doc, offset, { docKey: 'test.xml', version: 1 });
      expect(hoverResult).toBeDefined();
      expect(hoverResult?.hover.title).toBe('data:skin.vars.fuente.family');
      expect(hoverResult?.hover.description).toContain('Font family');
    });

    it('should not provide hover for undeclared variable', () => {
      const doc = `${EMPIRICAL_TEMPLATE}\n<data:skin.vars.otracosa/>`;
      const targetStr = 'data:skin.vars.otracosa';
      const offset = doc.indexOf(targetStr) + 5;

      const hoverResult = service.getHover(doc, offset, { docKey: 'test.xml', version: 1 });
      expect(hoverResult).toBeUndefined();
    });
  });

  describe('css Skin Variables ($ and $(...)) inside <b:skin>', () => {
    const service = new TemplateLanguageService();

    it('should suggest declared variables on bare $ inside b:skin CDATA', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="name" type="string"/>\n<Variable name="admin.name" type="string"/>\nbody { color: $`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'skin_bare.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('name');
      expect(names).toContain('admin.name');
      expect(names).not.toContain('otracosa');

      // admin.name contains a dot, so in CSS it must insert (admin.name)
      const adminSug = result!.suggestions.find(s => s.name === 'admin.name');
      expect(adminSug?.insertText).toBe('(admin.name)');

      // name has no dot, so insertText can be plain name
      const nameSug = result!.suggestions.find(s => s.name === 'name');
      expect(nameSug?.insertText).toBe('name');
    });

    it('should suggest variables on $( inside b:skin CDATA', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="name" type="string"/>\n<Variable name="admin.name" type="string"/>\nbody { color: $(`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'skin_paren.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('name');
      expect(names).toContain('admin.name');
    });

    it('should suggest color modifiers on $(primary. inside b:skin CDATA', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="primary" type="color"/>\nbody { color: $(primary.`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'skin_color.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('red');
      expect(names).toContain('green');
      expect(names).toContain('blue');
      expect(names).toContain('alpha');
      expect(names).toContain('transparent');
      expect(names).toContain('inverse');
    });

    it('should suggest font modifiers on $(fuente. inside b:skin CDATA', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="fuente" type="font"/>\nbody { font: $(fuente.`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'skin_font.xml', version: 1 });
      expect(result).toBeDefined();

      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['family', 'size']);
    });

    it('should not suggest skin CSS variables outside b:skin', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="name" type="string"/>\n]]></b:skin>\n<b:widget id="b1" type="Blog"><b:includable id="main">\n$`;
      const offset = doc.length;

      const result = service.getCompletions(doc, offset, { docKey: 'outside_test.xml', version: 1 });
      expect(result).toBeUndefined();
    });

    it('should provide hover information for $name and $(admin.name) in CSS', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="name" description="My Name" type="string" default="Default Name" value="My Name"/>\n<Variable name="admin.name" description="Admin Name" type="string" value="Abel"/>\nbody { color: $name; background: $(admin.name); }\n]]></b:skin>`;

      const nameOffset = doc.indexOf('$name') + 2;
      const hoverName = service.getHover(doc, nameOffset, { docKey: 'hover_name_admin.xml', version: 1 });
      expect(hoverName).toBeDefined();
      expect(hoverName?.hover.title).toBe('$name');
      expect(hoverName?.hover.description).toContain('My Name');
      expect(hoverName?.hover.description).toContain('**Default:** `Default Name`');
      expect(hoverName?.hover.description).toContain('**Value:** `My Name`');

      const adminOffset = doc.indexOf('$(admin.name)') + 3;
      const hoverAdmin = service.getHover(doc, adminOffset, { docKey: 'hover_name_admin.xml', version: 1 });
      expect(hoverAdmin).toBeDefined();
      expect(hoverAdmin?.hover.title).toBe('$(admin.name)');
      expect(hoverAdmin?.hover.description).toContain('Admin Name');
      expect(hoverAdmin?.hover.description).toContain('**Value:** `Abel`');
    });

    it('should provide hover for $(primary.red) in CSS', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="primary" type="color"/>\nbody { color: $(primary.red); }\n]]></b:skin>`;
      const redOffset = doc.indexOf('$(primary.red)') + 3;

      const hoverRed = service.getHover(doc, redOffset, { docKey: 'hover_color_mod.xml', version: 1 });
      expect(hoverRed).toBeDefined();
      expect(hoverRed?.hover.title).toBe('$(primary.red)');
      expect(hoverRed?.hover.description).toContain('Red channel');
    });

    it('should not provide hover for undeclared CSS variable $otracosa', () => {
      const doc = `<b:skin><![CDATA[\n<Variable name="name" type="string"/>\nbody { color: $otracosa; }\n]]></b:skin>`;
      const offset = doc.indexOf('$otracosa') + 2;

      const hover = service.getHover(doc, offset, { docKey: 'hover_undeclared.xml', version: 1 });
      expect(hover).toBeUndefined();
    });
  });

  describe('linter Diagnostics for Theme Designer Skin Variables', () => {
    const service = new TemplateLanguageService();

    it('should not report errors for valid skin variables in empirical template', () => {
      const diags = service.getDiagnostics(EMPIRICAL_TEMPLATE);
      const skinDiags = diags.filter(d => d.code === 'BX1025' && (d.message.includes('skin variable') || d.message.includes('modifier')));
      expect(skinDiags).toHaveLength(0);
    });

    it('should report error for undeclared bare variable $otracosa inside b:skin', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="name" type="string"/>
$name
$otracosa
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025') && d.message.includes('otracosa'));

      expect(err).toBeDefined();
      expect(err?.message).toContain('otracosa');
    });

    it('should report error for undeclared bare variable inside CSS comments in b:skin', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="name" type="string"/>
/* $otracosa */
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025') && d.message.includes('otracosa'));

      expect(err).toBeDefined();
    });

    it('should report error for undeclared parenthesized variable $(otracosa) inside b:skin', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="name" type="string"/>
$(name)
$(otracosa)
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025') && d.message.includes('otracosa'));

      expect(err).toBeDefined();
      expect(err?.message).toContain('otracosa');
    });

    it('should report error with quick fix when dotted variable is called without parentheses ($admin.name)', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="admin.name" type="string"/>
$admin.name
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1052' || d.code === 'BX1025') && d.message.includes('admin.name'));

      expect(err).toBeDefined();
      expect(err?.message).toContain('admin.name');
      expect(err?.quickFixes).toBeDefined();
      expect(err?.quickFixes?.[0]?.newText).toBe('$(admin.name)');
    });

    it('should report error for unknown modifier on valid variable in CSS ($(primary.unknownMod))', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="primary" type="color"/>
$(primary.unknownMod)
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025') && d.message.includes('unknownMod'));

      expect(err).toBeDefined();
      expect(err?.message).toContain('unknownMod');
    });

    it('should report warning for unresolvable variable in XML data tag (<data:skin.vars.otracosa/>)', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="name" type="string"/>
]]></b:skin>
<data:skin.vars.otracosa/>`;

      const diags = service.getDiagnostics(doc);
      const warn = diags.find(d => (d.code === 'BX1025' || d.code === 'BX1051') && d.message.includes('skin.vars.otracosa'));

      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
      expect(warn?.message).toBe('<!--Can\'t find substitution for tag [skin.vars.otracosa]-->');
    });

    it('should report error in expressions (expr:class="data:skin.vars.otracosa")', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="name" type="string"/>
]]></b:skin>
<div expr:class='data:skin.vars.otracosa'/>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025' || d.code === 'BX1051') && d.message.includes('otracosa'));

      expect(err).toBeDefined();
    });

    it('should report warning with quick fix when data:skin.vars uses dots instead of underscores for dotted variables', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="admin.name" type="string"/>
]]></b:skin>
<data:skin.vars.admin.name/>`;

      const diags = service.getDiagnostics(doc);
      const warn = diags.find(d => (d.code === 'BX1054' || d.code === 'BX1025') && (d.message.includes('admin.name') || d.message.includes('skin.vars')));

      expect(warn).toBeDefined();
      expect(warn?.quickFixes?.[0]?.newText).toContain('data:skin.vars.admin_name');
    });

    it('should NOT report BX1054 warning for skin:color and skin:font modifiers using dot notation', () => {
      const doc = `<b:skin><![CDATA[
<Group description="Accents">
  <Variable name="primary" description="Accents" type="color" default="#fff" value="#fff"/>
  <Variable name="fuente" description="Roboto Bold 22" type="font" default="bold 22px Roboto, sans-serif" hideEditor="true" value="bold 22px Roboto, sans-serif"/>
</Group>
]]></b:skin>
<data:skin.vars.primary.red/>
<data:skin.vars.fuente.family/>`;

      const diags = service.getDiagnostics(doc);
      const bx1054Diags = diags.filter(d => d.code === 'BX1054');

      expect(bx1054Diags).toHaveLength(0);
    });

    it('should report warning for unknown modifier on valid variable in data:skin.vars.<var>.<mod>', () => {
      const doc = `<b:skin><![CDATA[
<Variable name="primary" type="color"/>
]]></b:skin>
<data:skin.vars.primary.invalidMod/>`;

      const diags = service.getDiagnostics(doc);
      const warn = diags.find(d => d.code === 'BX1025' && d.message.includes('primary.invalidMod'));

      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
      expect(warn?.message).toBe('<!--Can\'t find substitution for tag [skin.vars.primary.invalidMod]-->');
    });

    it('should NOT report BX1053 for dotted skin variables with valid modifiers in CSS', () => {
      const doc = `<b:skin><![CDATA[
<Group description="Accents">
  <Variable name="primary.accent" description="Accents" type="color" default="#fff" value="#fff"/>
  <Variable name="fuente.prueba" description="Roboto Bold 22" type="font" default="bold 22px Roboto, sans-serif" hideEditor="true" value="bold 22px Roboto, sans-serif"/>
</Group>
$(primary.accent.red)
$(fuente.prueba.family)
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const bx1053Diags = diags.filter(d => d.code === 'BX1053');

      expect(bx1053Diags).toHaveLength(0);
    });

    it('should reject invalid modifiers and spurious nested paths in CSS with BX1053 error', () => {
      const doc = `<b:skin><![CDATA[
<Group description="Accents">
  <Variable name="primary" description="Accents" type="color" default="#fff" value="#fff"/>
  <Variable name="fuente" description="Roboto Bold 22" type="font" default="bold 22px Roboto, sans-serif" hideEditor="true" value="bold 22px Roboto, sans-serif"/>
</Group>
$(fuente.family)
$(primary.red)
$(primary.prueba.prueba.red)
$(fuente.prueba)
$(fuente.prueba.family)
]]></b:skin>`;

      const diags = service.getDiagnostics(doc);
      const bx1053Diags = diags.filter(d => d.code === 'BX1053');

      expect(bx1053Diags).toHaveLength(3);
      expect(bx1053Diags.every(d => d.severity === 'error')).toBe(true);

      const nestedErr1 = bx1053Diags.find(d => d.message.includes('primary') && d.message.includes('prueba.prueba.red'));
      expect(nestedErr1).toBeDefined();

      const modErr = bx1053Diags.find(d => d.message.includes('fuente') && d.message.includes('prueba'));
      expect(modErr).toBeDefined();

      const nestedErr2 = bx1053Diags.find(d => d.message.includes('fuente') && d.message.includes('prueba.family'));
      expect(nestedErr2).toBeDefined();
    });

    it('should work identically inside b:template-skin', () => {
      const doc = `<b:template-skin><![CDATA[
<Variable name="brand" type="string"/>
$brand
$unknown
]]></b:template-skin>`;

      const diags = service.getDiagnostics(doc);
      const err = diags.find(d => (d.code === 'BX1053' || d.code === 'BX1025') && d.message.includes('unknown'));

      expect(err).toBeDefined();
    });
  });
});
