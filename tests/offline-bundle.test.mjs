import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
test('every offline precache entry exists and app versions agree',()=>{
 const worker=read('sw.js'),match=worker.match(/const ASSETS=\[([^\]]+)\]/);
 assert.ok(match,'Service worker precache list missing');
 const assets=[...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 for(const asset of assets){assert.ok(asset.startsWith('./'));assert.ok(existsSync(resolve(root,asset.split('?')[0]))||asset==='./',`Missing offline resource: ${asset}`);}
 assert.match(worker,/ph-complaints-v2\.9\.1/);
 assert.match(read('package.json'),/"version":"2\.9\.1"/);
 assert.match(read('index.html'),/VERSION 2\.9\.1/);
 assert.match(read('app.js'),/const VERSION='2\.9\.1'/);
});
test('GitHub Pages navigation, PWA and file upload use subpath-local assets',()=>{
 const html=read('index.html'),manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./#/overview');
 assert.match(html,/href="\.\/styles-2\.9\.1\.css"/);assert.match(html,/src="\.\/hub-2\.9\.1\.js"/);
 assert.match(html,/worker-src 'self'/);assert.match(html,/base-uri 'none'/);
 assert.match(read('app.js'),/new Worker\('\.\/workbook-2\.9\.1\.js'/);
 assert.ok(existsSync(resolve(root,'.nojekyll')));
});
