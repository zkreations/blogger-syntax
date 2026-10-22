import { describe, expect, it } from 'vitest';
import { TemplateLanguageService } from '../../src/core/service/templateLanguageService.js';

describe('unresolved <data:...> Substitution Tags Diagnostics', () => {
  const service = new TemplateLanguageService();

  describe('basic Variable Resolution', () => {
    it('should warn for undeclared global variable <data:otracosa/>', () => {
      const doc = `<data:otracosa/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [otracosa]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
      expect(warn?.message).toBe('<!--Can\'t find substitution for tag [otracosa]-->');
    });

    it('should not warn for valid global variable <data:blog.title/>', () => {
      const doc = `<data:blog.title/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution'));
      expect(warn).toBeUndefined();
    });

    it('should warn for invalid property on global <data:blog.unknownProperty/>', () => {
      const doc = `<data:blog.unknownProperty/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [blog.unknownProperty]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });

    it('should warn for <data:otracosa/> embedded inside HTML attribute value', () => {
      const doc = `<input value='<data:otracosa/>'/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [otracosa]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
      expect(warn?.range.start.character).toBe(14);
    });
  });

  describe('widget Scope Resolution', () => {
    it('should resolve widget-specific data inside matching b:widget', () => {
      const doc = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <data:title/>
    <data:newerPageUrl/>
  </b:includable>
</b:widget>`;
      const diags = service.getDiagnostics(doc);

      const warns = diags.filter(d => d.message.includes('Can\'t find substitution'));
      expect(warns).toHaveLength(0);
    });

    it('should warn for widget data used outside any widget (<data:title/> at root)', () => {
      const doc = `<data:title/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [title]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });

    it('should resolve data:widget.* meta properties inside widget and warn outside', () => {
      const docInside = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <data:widget.instanceId/>
    <data:widget.sectionId/>
  </b:includable>
</b:widget>`;
      const diagsInside = service.getDiagnostics(docInside);
      expect(diagsInside.filter(d => d.message.includes('Can\'t find substitution'))).toHaveLength(0);

      const docOutside = `<data:widget.instanceId/>`;
      const diagsOutside = service.getDiagnostics(docOutside);
      const warn = diagsOutside.find(d => d.message.includes('Can\'t find substitution for tag [widget.instanceId]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });
  });

  describe('b:loop Scope and Inferred Properties', () => {
    it('should resolve loop item properties inside b:loop', () => {
      const doc = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <b:loop values='data:posts' var='post'>
      <data:post.title/>
      <data:post.body/>
      <data:post.author.name/>
    </b:loop>
  </b:includable>
</b:widget>`;
      const diags = service.getDiagnostics(doc);
      const warns = diags.filter(d => d.message.includes('Can\'t find substitution'));
      expect(warns).toHaveLength(0);
    });

    it('should warn for unknown property on loop item <data:post.unknownField/>', () => {
      const doc = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <b:loop values='data:posts' var='post'>
      <data:post.unknownField/>
    </b:loop>
  </b:includable>
</b:widget>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [post.unknownField]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });

    it('should warn when loop variable is accessed outside its b:loop block', () => {
      const doc = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <b:loop values='data:posts' var='post'>
      <data:post.title/>
    </b:loop>
    <data:post.title/>
  </b:includable>
</b:widget>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [post.title]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });

    it('should resolve loop index variable', () => {
      const doc = `
<b:widget id='Blog1' type='Blog'>
  <b:includable id='main'>
    <b:loop values='data:posts' var='post' index='i'>
      <data:i/>
    </b:loop>
  </b:includable>
</b:widget>`;
      const diags = service.getDiagnostics(doc);
      expect(diags.filter(d => d.message.includes('Can\'t find substitution'))).toHaveLength(0);
    });

    it('should infer properties from literal array of objects in b:loop', () => {
      const doc = `
<b:loop values='[{ name: "Daniel", age: 20 }]' var='person'>
  <data:person.name/>
  <data:person.age/>
  <data:person.email/>
</b:loop>`;
      const diags = service.getDiagnostics(doc);

      const warnEmail = diags.find(d => d.message.includes('Can\'t find substitution for tag [person.email]'));
      expect(warnEmail).toBeDefined();
      expect(warnEmail?.severity).toBe('warning');

      const warnsOther = diags.filter(d => d.message.includes('person.name') || d.message.includes('person.age'));
      expect(warnsOther).toHaveLength(0);
    });
  });

  describe('b:with Scope and Shadowing', () => {
    it('should resolve properties inferred from b:with literal object', () => {
      const doc = `
<b:with value='{ city: "Lima", zip: 15001 }' var='location'>
  <data:location.city/>
  <data:location.zip/>
  <data:location.country/>
</b:with>`;
      const diags = service.getDiagnostics(doc);

      const warnCountry = diags.find(d => d.message.includes('Can\'t find substitution for tag [location.country]'));
      expect(warnCountry).toBeDefined();
      expect(warnCountry?.severity).toBe('warning');

      const warnsValid = diags.filter(d => d.message.includes('location.city') || d.message.includes('location.zip'));
      expect(warnsValid).toHaveLength(0);
    });

    it('should respect lexical shadowing in nested scopes', () => {
      const doc = `
<b:loop values='[{ name: "Mickey", age: 10 }]' var='person'>
  <b:loop values='[{ nombre: "Daniel", edad: 20 }]' var='person'>
    <data:person.nombre/>
    <data:person.edad/>
    <data:person.name/>
    <data:person.age/>
  </b:loop>
</b:loop>`;
      const diags = service.getDiagnostics(doc);

      const warnName = diags.find(d => d.message.includes('Can\'t find substitution for tag [person.name]'));
      const warnAge = diags.find(d => d.message.includes('Can\'t find substitution for tag [person.age]'));

      expect(warnName).toBeDefined();
      expect(warnName?.severity).toBe('warning');
      expect(warnAge).toBeDefined();
      expect(warnAge?.severity).toBe('warning');

      const warnsInner = diags.filter(d => d.message.includes('person.nombre') || d.message.includes('person.edad'));
      expect(warnsInner).toHaveLength(0);
    });
  });

  describe('messages and Theme Designer Skin Variables', () => {
    it('should resolve valid messages and warn for invalid message key', () => {
      const doc = `
<data:messages.home/>
<data:messages.unknownKey12345/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [messages.unknownKey12345]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');

      const warnHome = diags.find(d => d.message.includes('messages.home'));
      expect(warnHome).toBeUndefined();
    });

    it('should warn for undeclared skin variable <data:skin.vars.otracosa/>', () => {
      const doc = `
<b:skin><![CDATA[
<Variable name="name" type="string"/>
]]></b:skin>
<data:skin.vars.name/>
<data:skin.vars.otracosa/>`;
      const diags = service.getDiagnostics(doc);

      const warn = diags.find(d => d.message.includes('Can\'t find substitution for tag [skin.vars.otracosa]'));
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');

      const warnName = diags.find(d => d.message.includes('skin.vars.name'));
      expect(warnName).toBeUndefined();
    });
  });

  describe('syntax Error Exclusions (Non-Interference)', () => {
    it('should not emit substitution warnings for prohibited bracket indexing in data tag (<data:array[0]/>)', () => {
      const doc = `<data:array[0]/>`;
      const diags = service.getDiagnostics(doc);

      // BX1032 must be present as error
      const bracketErr = diags.find(d => d.code === 'BX1032');
      expect(bracketErr).toBeDefined();
      expect(bracketErr?.severity).toBe('error');

      // No substitution warning should be emitted
      const subWarn = diags.find(d => d.message.includes('Can\'t find substitution'));
      expect(subWarn).toBeUndefined();
    });
  });

  describe('linter Rule Configuration', () => {
    it('should suppress substitution warnings when unresolvedData rule is disabled', () => {
      const doc = `<data:otracosa/>`;
      const diagsEnabled = service.getDiagnostics(doc, { rules: { unresolvedData: true } });
      expect(diagsEnabled.some(d => d.message.includes('Can\'t find substitution'))).toBe(true);

      const diagsDisabled = service.getDiagnostics(doc, { rules: { unresolvedData: false } });
      expect(diagsDisabled.some(d => d.message.includes('Can\'t find substitution'))).toBe(false);
    });
  });
});
