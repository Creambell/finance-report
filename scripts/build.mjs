import { build } from 'esbuild';
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(path.join(root, 'dist'), {recursive:true});
// Resolve through Node so the build also works on restricted Windows workspaces.
const require = createRequire(path.join(root, 'package.json'));
const workspaceFiles = {name:'workspace-files',setup(context){
  context.onResolve({filter:/.*/}, args => ({path:args.path.startsWith('.') || path.isAbsolute(args.path) ? path.resolve(args.resolveDir || root,args.path) : require.resolve(args.path),namespace:'workspace'}));
  context.onLoad({filter:/.*/,namespace:'workspace'}, async args => ({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.css')?'css':args.path.endsWith('.jsx')?'jsx':'js',resolveDir:path.dirname(args.path)}));
}};
const result = await build({absWorkingDir:root,tsconfigRaw:{compilerOptions:{}},entryPoints:['./src/main.jsx'], plugins:[workspaceFiles],write:false,bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'dist/app.js',define:{'process.env.NODE_ENV':'"production"'},legalComments:'none',jsx:'automatic'});
for (const output of result.outputFiles) await writeFile(output.path,output.contents);
await copyFile(path.join(root,'dist/app.css'),path.join(root,'dist/style.css'));
const shell = (css, js) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="나이·소득·자산을 입력해 나만의 재무 리포트를 만드세요."><title>LIFEPLAN · 나의 재무 리포트</title>${css}</head><body><div id="root"></div>${js}</body></html>`;
await writeFile(path.join(root,'dist/index.html'), shell('<link rel="stylesheet" href="app.css">','<script defer src="app.js"></script>'));
const css = await readFile(path.join(root,'dist/app.css'),'utf8');
const js = await readFile(path.join(root,'dist/app.js'),'utf8');
await writeFile(path.join(root,'dist/재무리포트.html'), shell(`<style>${css}</style>`,`<script>${js.replace(/<\/script/gi,'<\\/script')}</script>`));
console.log('Built dist/index.html and standalone 재무리포트.html');
