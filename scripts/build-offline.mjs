import{build}from'esbuild';
import fs from'node:fs';import path from'node:path';
// Bundles on disk only. No Wrangler, account lookup, upload, or fetch is used.
fs.mkdirSync('.build',{recursive:true});
await build({entryPoints:['worker/index.mjs'],outfile:'.build/index.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',sourcemap:false,minify:false,plugins:[{name:'local-module-query',setup(builder){builder.onResolve({filter:/\.mjs\?/},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));}}]});
console.log('Offline Worker bundle passed: '+fs.statSync('.build/index.mjs').size+' bytes. No deployment performed.');
