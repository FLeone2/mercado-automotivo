const fs = require('node:fs');
const assert = require('node:assert/strict');
const themeAPI = require('../src/catalog-themes.js');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/catalog-themes.css', 'utf8');
const values = new Map();
const root = {style: {setProperty: (k,v) => values.set(k,v), removeProperty: k => values.delete(k)}, dataset: {colorScheme:'light'}};
const document = {documentElement:root,querySelector:()=>null};
const registrySource = html.slice(html.indexOf('var C5='),html.indexOf('var k5='));
const api = new Function('document','getComputedStyle',registrySource+';return {C5,T5,O5,E5};')(document,()=>({getPropertyValue:()=>''}));
const legacy = api.T5.map(t=>t.id);
const result = themeAPI.installCatalogThemes(api.T5,api.C5);
assert.strictEqual(result,api.T5);
assert.equal(api.T5.length,19,'14 requested themes + 5 preserved legacy options');
for(const id of legacy) assert(api.T5.some(t=>t.id===id));
assert.equal(new Set(api.T5.map(t=>t.id)).size,api.T5.length);
assert.equal(themeAPI.CATALOG_REQUESTED_THEME_IDS.length,14);
assert.equal(api.T5.find(t=>t.id==='original').label,'Verde profundo');
themeAPI.installCatalogThemes(api.T5,api.C5);
assert.equal(api.T5.length,19,'idempotent integration');
const luminance = hex => {
 const v=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return v[0]*.2126+v[1]*.7152+v[2]*.0722;
};
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const semantics={light:['#168043','#e02e2a','#00815f','#4278c7','#20877f','#b47c31','#956bb9','#7990af','#fa423e','#8f8f8f'],dark:['#40c977','#ff6764','#5bd3ac','#91b4ef','#77d6cc','#e5b76e','#d1a9eb','#a3bde0','#ff6764','#afafaf']};
for(const [id] of themeAPI.CATALOG_THEME_PALETTES) {
 for(const appearance of ['light','dark']) {
  const t=api.O5(id,appearance),tokens=api.E5(t,appearance);
  assert.equal(root.dataset.appTheme,id);assert.equal(root.style.colorScheme,appearance);
  assert.equal(tokens.length,api.C5.length);assert(!tokens.includes(undefined));
  assert.deepEqual(tokens.slice(11,21),semantics[appearance]);
  assert.equal(values.get('--font-sans'),themeAPI.CATALOG_THEME_FONT);
  for(const bg of ['background','surface','surface-raised','muted','control','control-hover'])
   for(const fg of ['text','secondary','accent'])
    assert(contrast(values.get('--'+bg),values.get('--'+fg))>=4.5,`${id}/${appearance}: ${bg}/${fg}`);
  assert(contrast(values.get('--accent'),values.get('--surface'))>=4.5,`${id}/${appearance} primary button`);
 }
}
// Switching among legacy, modern and retro choices uses the existing reset path.
api.O5('windows-95','dark');api.O5('aqua-clean','light');api.O5('liquid-blue','dark');api.O5('original');
assert.equal(values.size,0);assert.equal(root.dataset.appTheme,'original');
assert.throws(()=>api.O5('unknown-theme'),/Unknown/);
for(const theme of api.T5)for(const key of ['tokens','darkTokens'])if(theme[key])assert.equal(theme[key].at(-1),themeAPI.CATALOG_THEME_FONT);
const storageSource=html.slice(html.indexOf('var JPe='),html.indexOf('function eFe('));
const persistence=new Function('Nz',storageSource+';return {s7,$Pe,QPe,o7};')(v=>v);
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
for(const theme of themeAPI.CATALOG_REQUESTED_THEME_IDS)for(const appearance of ['system','light','dark']) {
 assert(persistence.s7({id:'theme-catalog-test'},{theme,appearance},storage));
 assert.deepEqual(persistence.$Pe({id:'theme-catalog-test'},storage),{theme,appearance});
 assert(persistence.o7({id:'theme-catalog-test'},appearance,storage));
 assert.equal(persistence.QPe({id:'theme-catalog-test'},storage),appearance);
}
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
assert.equal(persistence.s7({id:'test'},{theme:'sage'},blocked),false);
assert.deepEqual(persistence.$Pe({id:'test'},blocked),{});
assert(!/@font-face|https?:|--mitsubishi-color\s*:|--chart-\d\s*:|--positive\s*:|--negative\s*:/i.test(css));
assert.match(css,/svg text/);assert.match(css,/font-family:var\(--font-sans\) !important/);
assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/prefers-reduced-transparency/);assert.match(css,/forced-colors/);
assert(!/setInterval|MutationObserver|localStorage|createElement/.test(fs.readFileSync('src/catalog-themes.js','utf8')));
console.log('PASS: 14 requested + 5 preserved themes; idempotency; 24 light/dark palettes; WCAG AA text/button contrast; stable semantics; global local-font fallback; actual apply/reset and persistence round trips; storage denial; accessibility CSS. Browser rendering not evaluated.');
