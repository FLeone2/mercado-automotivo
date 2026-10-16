const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('src/blue-theme.css','utf8');
const registry=html.slice(html.indexOf('var C5='),html.indexOf('var k5='));
let values=new Map();const root={style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)},dataset:{colorScheme:'light'}};
const document={documentElement:root,querySelector:()=>null};
const api=new Function('document','getComputedStyle',registry+';return {C5,T5,O5,E5};')(document,()=>({getPropertyValue:()=>''}));
assert.deepEqual(api.T5.slice(0,7).map(t=>t.id),['original','codex-classic','default','dark-pixel','scientific-blue','sticker-pop','liquid-blue']);
const theme=api.T5.find(t=>t.id==='liquid-blue');const baseline=JSON.parse(fs.readFileSync('src/blue-theme.json','utf8'));assert.deepEqual(theme.tokens.slice(0,26),baseline.tokens.slice(0,26));assert.deepEqual(theme.darkTokens.slice(0,26),baseline.darkTokens.slice(0,26));
const original={light:['#168043','#e02e2a','#00815f','#4278c7','#20877f','#b47c31','#956bb9','#7990af','#fa423e','#8f8f8f'],dark:['#40c977','#ff6764','#5bd3ac','#91b4ef','#77d6cc','#e5b76e','#d1a9eb','#a3bde0','#ff6764','#afafaf']};
const lum=h=>{const a=h.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const appearance of ['light','dark']){
 assert.equal(api.E5(theme,appearance).length,api.C5.length);
 api.O5('liquid-blue',appearance);assert.equal(root.dataset.appTheme,'liquid-blue');assert.equal(root.style.colorScheme,appearance);
 assert.equal(values.get('--accent'),'#3487FF');assert.match(values.get('--font-sans'),/^"Segoe UI"/);
 assert.deepEqual(api.E5(theme,appearance).slice(11,21),original[appearance]);
 for(const bg of ['background','surface','surface-raised','muted','control','control-hover'])for(const fg of ['text','secondary'])assert(contrast(values.get('--'+bg),values.get('--'+fg))>=4.5,`${appearance} ${bg}/${fg}`);
 assert(contrast(appearance==='light'?'#155bbb':'#9ac6ff',values.get('--surface'))>=4.5);
}
assert(contrast('#10233f','#3487FF')>=4.5);
api.O5('original');assert.equal(values.size,0,'Switching back clears blue tokens');
const storageSource=html.slice(html.indexOf('var JPe='),html.indexOf('function eFe('));
const persistence=new Function('Nz',storageSource+';return {s7,$Pe};')(v=>v);
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
for(const appearance of ['system','light','dark']){assert(persistence.s7({id:'theme-test'},{theme:'liquid-blue',appearance},storage));assert.deepEqual(persistence.$Pe({id:'theme-test'},storage),{theme:'liquid-blue',appearance});}
assert.equal(html.match(/<style id="market-blue-theme-styles">([\s\S]*?)<\/style>/)[1].trim(),css.trim());
assert(!css.includes('--mitsubishi-color:'));assert(!css.includes('@font-face'));
assert.equal(cp.execFileSync('git',['diff','da24531','--','data',':(exclude)data/scenarios/manifest.json']).toString(),'');
console.log('PASS blue registry/apply/reset, existing themes, light/dark contrast, semantic colors, actual storage round trip and embedded CSS.');
