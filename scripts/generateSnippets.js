import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import esbuild from 'esbuild';

async function generateSnippets() {
  const combined = await esbuild.build({
    stdin: {
      contents: `
        export { bloggerTags } from './src/core/data/tagsData.ts';
        export { bloggerDescriptions } from './src/core/data/descriptions.ts';
      `,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
  });

  const code = combined.outputFiles[0].text;
  const dataUri = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  const { bloggerTags, bloggerDescriptions } = await import(dataUri);

  const descriptionsChoices = bloggerDescriptions.join(',');

  const snippets = {};

  // 1. Generate snippets from bloggerTags
  for (const [key, tag] of Object.entries(bloggerTags)) {
    const title = `${key
      .replace(/^b:/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')} tag`;

    const snippetBody = tag.snippetBody.startsWith('<') ? tag.snippetBody : `<${tag.snippetBody}`;
    const bodyLines = snippetBody.split('\n');

    snippets[title] = {
      prefix: tag.name,
      body: bodyLines,
      description: tag.description,
    };
  }

  // 2. Add skin designer Group snippet
  snippets['Group tag'] = {
    prefix: 'Group',
    body: [
      `<Group description="\${1|${descriptionsChoices}|}" selector="\${2:selector}">`,
      '\t$0',
      '</Group>',
    ],
    description: 'Groups variables and creates a section in the Blogger Template Designer.',
  };

  // 3. Add skin designer Variable snippet
  snippets['Variable tag'] = {
    prefix: 'Variable',
    body: [
      `<Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="\${3|color,font,length,string,background|}" default="\${4:default}" value="\${5:value}"/>$0`,
    ],
    description: 'Creates customization options for the Blogger Template Designer.',
  };

  const outputPath = resolve(process.cwd(), 'snippets/snippets.code-snippets');
  writeFileSync(outputPath, `${JSON.stringify(snippets, null, 2)}\n`, 'utf-8');
  console.log(`Generated ${Object.keys(snippets).length} snippets successfully into ${outputPath}`);
}

generateSnippets().catch((err) => {
  console.error('Error generating snippets:', err);
  process.exit(1);
});
