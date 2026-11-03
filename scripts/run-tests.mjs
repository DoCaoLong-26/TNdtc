import fs from'node:fs';import{spawnSync}from'node:child_process';
for(let file of fs.readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).sort()){console.log('\nTest: '+file);let r=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit'});if(r.status)process.exit(r.status||1);}console.log('\nAll tests passed.');
