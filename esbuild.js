import process from 'node:process';
import esbuild from 'esbuild';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const baseConfig = {
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  external: ['vscode'],
  logLevel: 'info',
};

/** @type {esbuild.BuildOptions} */
const nodeConfig = {
  ...baseConfig,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.cjs',
  format: 'cjs',
  platform: 'node',
};

/** @type {esbuild.BuildOptions} */
const browserConfig = {
  ...baseConfig,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/web/extension.js',
  format: 'cjs',
  platform: 'browser',
};

async function main() {
  if (isWatch) {
    const nodeCtx = await esbuild.context(nodeConfig);
    const browserCtx = await esbuild.context(browserConfig);
    await Promise.all([nodeCtx.watch(), browserCtx.watch()]);
    console.log('Watching for changes...');
  }
  else {
    await Promise.all([
      esbuild.build(nodeConfig),
      esbuild.build(browserConfig),
    ]);
    console.log('Build completed successfully.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
