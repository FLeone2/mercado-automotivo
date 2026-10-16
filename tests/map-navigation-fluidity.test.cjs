// Deterministic cache/lifecycle regressions; not browser frame-rate measurements.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/catalog-maps.js','utf8');
function harness(){
 let slots=[],cursor=0,effects=[],queue=[];const requests=[];
 const React={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},useEffect(fn,deps){const i=cursor++,previous=effects[i];if(!previous||deps.some((d,j)=>d!==previous.deps[j]))queue.push(()=>{previous?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const ctx=vm.createContext({React,URL,AbortController,fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url:String(url),options,resolve:data=>resolve({ok:true,json:async()=>data}),reject}))});
 vm.runInContext(source+';globalThis.api={catalogMunicipalJoin,catalogPathCentroid,catalogMunicipalIndex,useCatalogMunicipalGeometry};',ctx);
 return {api:ctx.api,requests,render(uf,base='https://example.test/data/'){cursor=0;return ctx.api.useCatalogMunicipalGeometry(uf,base,Boolean(uf));},flush(){const pending=queue;queue=[];pending.forEach(fn=>fn());},settle:()=>new Promise(resolve=>setImmediate(resolve))};
}
const geometry=uf=>({uf,viewBox:'0 0 10 10',features:[{name:'Capital',code:uf+'1',path:'M0,0L10,0L10,10L0,10Z'}]});
test('immutable geometry index reuses identical centroids across volume updates and rejects ambiguous names',()=>{
 const h=harness(),geo=geometry('BA'),path=geo.features[0].path;let reads=0;
 Object.defineProperty(geo.features[0],'path',{get(){reads++;return path;}});
 const rows=[{name:'CAPITAL · BA',count:1}],first=h.api.catalogMunicipalJoin(rows,geo),index=h.api.catalogMunicipalIndex(geo),firstReads=reads;
 const second=h.api.catalogMunicipalJoin([{...rows[0],count:99}],geo);
 assert.equal(h.api.catalogMunicipalIndex(geo),index);assert.equal(reads,firstReads+1,'Only returned path is read again, not reparsed for its centroid');
 assert.deepEqual([first.matches[0].x,first.matches[0].y],Array.from(h.api.catalogPathCentroid(path)));
 assert.equal(second.matches[0].x,first.matches[0].x);assert.equal(second.matches[0].y,first.matches[0].y);assert.equal(second.matches[0].count,99);
 const duplicate=geometry('BA');duplicate.features.push({...duplicate.features[0],code:'other'});assert.equal(h.api.catalogMunicipalJoin(rows,duplicate).matches.length,0);
 assert.notEqual(h.api.catalogMunicipalIndex(duplicate),index);
});
test('Brazil → UF → other UF → Brazil → cached UF never flashes stale geometry or refetches on return',async()=>{
 const h=harness();assert.equal(h.render('').data,null);h.flush();
 assert.equal(h.render('BA').data,null);h.flush();const ba=h.requests[0];
 assert.equal(h.render('SP').data,null);h.flush();assert.equal(ba.options.signal.aborted,true);
 const sp=geometry('SP');h.requests[1].resolve(sp);await h.settle();assert.equal(h.render('SP').data,sp);h.flush();
 ba.resolve(geometry('BA'));await h.settle();assert.equal(h.render('SP').data,sp,'A late aborted response cannot replace current UF');h.flush();
 assert.equal(h.render('').data,null);h.flush();
 const returned=h.render('SP');assert.equal(returned.data,sp,'Cache is visible before effects run');assert.equal(returned.pending,false);h.flush();assert.equal(h.requests.length,2);
 assert.equal(h.render('SP','https://other.test/data/').data,null,'The same UF from another dataset must not reuse stale geometry');h.flush();assert.equal(h.requests.length,3);
});
test('stale load error is scoped to its UF and reduced-motion plus fixed map/loading heights are retained',async()=>{
 const h=harness();h.render('BA');h.flush();h.requests[0].reject(new Error('BA unavailable'));await h.settle();assert.equal(h.render('BA').error,'BA unavailable');h.flush();
 const next=h.render('SP');assert.equal(next.error,null);assert.equal(next.pending,true);h.flush();
 const css=fs.readFileSync('src/primary-map.css','utf8');
 assert.match(css,/\.pm-primary \.pm-map\{[^}]*height:var\(--pm-map-height\)/);
 assert.match(css,/\.pm-primary \.pm-empty\{[^}]*height:var\(--pm-map-height\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[^}]*transition:none/);
 assert.equal((css.match(/--pm-map-height:/g)||[]).length,3,'Desktop, tablet and phone set shared viewport heights');
});
