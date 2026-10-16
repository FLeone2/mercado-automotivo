const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const html=fs.readFileSync('index.html','utf8'),source=fs.readFileSync('src/navigation.js','utf8'),css=fs.readFileSync('src/navigation.css','utf8');
const jsx=(type,props,key)=>({type,props,key});
const api=new Function('jsxRuntime','SCENARIO_TABS',source+';return {marketTabs,marketNavigation,navigationLocation,MarketNavigation,MarketSubnavigation};')({jsx,jsxs:jsx},[{value:'diagnostic',label:'Diagnóstico'}]);
function all(n){return n&&typeof n==='object'?[n,...[n.props?.children].flat(Infinity).flatMap(all)]:[];}
assert.deepEqual(api.marketNavigation.map(g=>g.label),['Panorama','Evolução','Concorrência','Segmentos','Territórios','Explorar','Cenários','Animações']);
const legacy=['dashboard','history','competition','ranking','technology','origin','geography','explore','models','quality'];
assert(legacy.every(id=>api.marketTabs.some(t=>t.id===id)));
for(const tab of api.marketTabs){
 let navigated=[];const tree=api.MarketNavigation({tab:tab.id,onNavigate:id=>navigated.push(id)}),nodes=[...all(tree),...all(api.MarketSubnavigation({tab:tab.id,onNavigate:id=>navigated.push(id)}))];
 const primary=nodes.find(n=>n.props?.className==='am-primary-nav');assert.equal(primary.props.children.length,8);
 const docs=nodes.find(n=>n.props?.className==='am-secondary-nav');assert.equal(docs.props.children.props.children,'Dados e metodologia');
 for(const button of all(tree).filter(n=>n.type==='button')){button.props.onClick();assert(api.marketTabs.some(t=>t.id===navigated.at(-1)));}
 const location=api.navigationLocation(tab.id);assert.equal(location.leaf,tab.id);
 assert(nodes.some(n=>n.props?.['aria-current']==='page'));
 if(location.group?.routes.length>1){const leaves=nodes.find(n=>n.props?.className==='am-leaf-nav');assert.equal(leaves.props.children.length,location.group.routes.length);assert.equal(leaves.props.children.filter(n=>n.props['aria-current']==='page').length,1);}
}
assert.equal(api.navigationLocation('ranking').group.label,'Concorrência');
assert.equal(api.navigationLocation('explore','structure').group.label,'Segmentos');
assert.equal(api.navigationLocation('explore','structure').label,'Pirâmide BD');
assert.equal(api.navigationLocation('origin').group.label,'Segmentos');
assert(html.includes("forcedView:tab==='structure'?'structure':null"));
assert(html.includes("view=forcedView??(v.view==='mitsubishi'"));
assert(html.includes("if(id==='explore'&&shell.sectionViews?.['explore:market-exploration']?.view==='structure')"));
const section=html.slice(html.indexOf("tab==='competition'&&"),html.indexOf("tab==='technology'&&"));
assert(section.indexOf("tab==='segments'")<section.indexOf('competition-bd-heading'));
assert(section.includes('competition-mix-heading'));assert(section.includes('models-detail'));
assert(html.includes("tab!=='ranking'&&jsxRuntime.jsxs('footer'"));
assert(html.includes('Recorte fixo e resultados congelados.'));assert(html.includes('Período e universo dos filtros globais acima'));assert(html.includes('track.referencePeriod'));
assert(css.includes('.am-app::before{inset:0;border-radius:inherit}'));assert(!/overflow\s*:\s*(hidden|clip)/.test(css));assert(css.includes('@media(max-width:440px)'));assert(css.includes('min-height:44px'));
// Navigation must not alter the exact data, calculation workers, source IDs or ranking presentation.
const base=cp.execFileSync('git',['show','8ac3274:index.html'],{maxBuffer:20*1024*1024}).toString();
const workers=s=>[...s.matchAll(/new Blob\(\[("(?:[^"\\]|\\.)*")\]/g)].map(m=>m[1]);const unchangedWorkers=s=>workers(s).filter(w=>!w.includes('installMarketWorker'));assert.deepEqual(unchangedWorkers(html),unchangedWorkers(base));assert(workers(html).some(w=>JSON.parse(w)===fs.readFileSync('src/performance-cache.js','utf8')+'\n'+fs.readFileSync('src/evolution-market-worker.js','utf8')));
const ids=s=>[...s.matchAll(/id:\s*["']([^"']+)["']/g)].map(m=>m[1]);for(const id of new Set(ids(base).filter(id=>id!=='geo-municipal-map-heading')))assert(ids(html).includes(id),'Preserved component '+id);
assert.equal(cp.execFileSync('git',['diff','8ac3274','--','data/cubes','data/origin-cubes','data/geography','data/manifest.json']).toString(),'');
assert(html.includes(source.trim()));
console.log('PASS: eight top-level areas; every old/new route and secondary link; consistent subnav without breadcrumbs; legacy pyramid favorite location; unchanged worker/data/component identities; frozen scenarios; footer and non-clipping responsive glass.');

// Approved shared primary map replaces the separate municipal map section.
assert(html.includes("id:'territories-primary-map'"));assert(html.includes("{id:'overview-map'}"));assert(html.includes("['independent-primary-map',tab"));
