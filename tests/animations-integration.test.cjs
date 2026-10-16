const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),headers=fs.readFileSync('_headers','utf8'),source=fs.readFileSync('src/animations.js','utf8'),nav=fs.readFileSync('src/navigation.js','utf8');
const expectedWorker=fs.readFileSync('src/performance-cache.js','utf8')+'\n'+fs.readFileSync('src/animations-data.js','utf8')+'\n'+fs.readFileSync('src/animations-worker.js','utf8');
const literal=html.match(/const ANIMATIONS_WORKER_SOURCE=("(?:[^"\\]|\\.)*");/);assert(literal);assert.equal(JSON.parse(literal[1]),expectedWorker);new vm.Script(expectedWorker);
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(inline.length,2);for(const [,s]of inline){new vm.Script(s);assert(headers.includes("'sha256-"+crypto.createHash('sha256').update(s).digest('base64')+"'"));}
assert.equal((html.match(/\/\/ BEGIN ANIMATIONS WORKSPACE/g)||[]).length,1);assert(html.includes("tab==='animations'?jsxRuntime.jsx(AnimationWorkspace,{manifest,filters:effectiveFilters,scope}):"));assert(html.includes("const marketEnabled=!['quality','models','explore','structure','animations'].includes(tab)"));assert(nav.includes("{id:'animations',label:'Animações',routes:['animations']}"));
for(const id of ['dashboard','history','competition','ranking','segments','structure','technology','origin','geography','explore','models','quality'])assert(nav.includes("id:'"+id+"'"));
for(const view of ['races','bubbles','mix','maps'])assert(source.includes("['"+view+"',"));
assert(source.includes("preset==='suv'&&porte?[porte]:[]"),'An SUV-local porte never leaks into other presets');
assert(source.includes("view==='bubbles'&&dimension==='uf'?'marca':dimension"),'Changing from UF race to bubbles selects a supported dimension');
for(const sourceName of ['evolution-brush','evolution-years','animations','animations-charts','animations-maps','page-notes'])assert.equal((html.match(new RegExp('<style id="'+sourceName+'-styles">','g'))||[]).length,1);
assert(html.includes('jsxRuntime.jsx(EvolutionInteractive,{key:evolutionView'));assert(html.includes("id:'territories-primary-map'"));assert(html.includes("id:'overview-map'"));assert(html.includes('PageNotesLayout'));
const css=fs.readFileSync('src/animations.css','utf8');assert(css.includes('minmax(min(100%,180px),1fr)'));assert(css.includes('flex-wrap:wrap'));assert(css.includes('min-width:0'));assert(css.includes('prefers-reduced-motion'));assert(css.includes('min-height:44px'));assert(source.includes('Exportar valores de todos os meses'));
console.log('PASS integrated animation mount, source worker identity, syntax/CSP, legacy routes, isolated controls, executive panels, primary maps, accessible responsive contracts and footer.');

assert(css.includes('background:var(--muted);color:var(--text);border-color:var(--accent)'),'Selected view stays readable in dark themes with pale accents');
