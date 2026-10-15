const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const workers=[...html.matchAll(/new Blob\(\[("(?:[^"\\]|\\.)*")\]/g)].map(m=>JSON.parse(m[1]));
const portable=value=>JSON.parse(JSON.stringify(value));
const dimensions=['marca','modelo','grupo_modelo'];
function workerApi(source,names){
 const context=vm.createContext({console,DOMException,TextEncoder,TextDecoder,URL,Blob,Response,DecompressionStream,AbortController,crypto:webcrypto,setTimeout});
 vm.runInContext(source.replace(/\}\)\(\);\s*$/,'globalThis.testApi={'+names.join(',')+'};})();'),context);
 return context.testApi;
}
const snapshotApi=workerApi(workers.find(w=>w.includes('installMarketWorker')),['installMarketWorker']);
const rankingApi=workerApi(workers.find(w=>w.includes('async function runRanking')),['runRanking']);
const completeManifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json')));
const manifest={...completeManifest,expectedMonths:['2025-09','2026-08','2026-09'],months:completeManifest.months.filter(m=>['2025-09','2026-08','2026-09'].includes(m.month))};
const cubeCache=new Map();
const loadCube=async meta=>{
 if(!cubeCache.has(meta.month))cubeCache.set(meta.month,JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data',meta.cubePath)))));
 return cubeCache.get(meta.month);
};
const august={start:'2026-08-01',end:'2026-08-31'},september={start:'2026-09-01',end:'2026-09-30'};
const sum=counts=>Object.values(counts).reduce((n,count)=>n+count,0);
const countsFor=(membership,dimension,entity)=>Object.hasOwn(membership[dimension],entity)?membership[dimension][entity]:{};

// Independent oracle decodes reviewed source rows without calling production aggregators.
function expectedMembership(cube,filters,range){
 const columns=cube.columns??[...cube.dimensions,'count'],index=Object.fromEntries(columns.map((key,i)=>[key,i]));
 const membership=Object.fromEntries(dimensions.map(d=>[d,new Map()]));let total=0;
 for(const row of cube.rows){
  const value=dimension=>String(cube.dictionaries[dimension]?.[row[index[dimension]]]??'Não informado');
  const date=value('date');if(date<range.start||date>range.end)continue;
  if(filters.population==='light'&&!['Auto','Comercial Leve'].includes(value('segmento')))continue;
  const accepted=Object.entries(filters).every(([dimension,selected])=>{
   if(['date','population'].includes(dimension)||selected==null||selected===''||selected==='all')return true;
   const choices=Array.isArray(selected)?selected:[selected];
   return choices.length===0||choices.includes('all')||choices.map(String).includes(value(dimension));
  });if(!accepted)continue;
  const count=Number(row[index.count]);total+=count;if(count<=0)continue;
  const brand=value('marca');
  for(const dimension of dimensions){const name=value(dimension),entities=membership[dimension];if(!entities.has(name))entities.set(name,new Map());const counts=entities.get(name);counts.set(brand,(counts.get(brand)??0)+count);}
 }
 return {total,membership:Object.fromEntries(dimensions.map(d=>[d,Object.fromEntries([...membership[d]].map(([entity,counts])=>[entity,Object.fromEntries(counts)]))]))};
}

async function snapshot(filters,{sourceManifest=manifest,load=loadCube,includeMitsubishiProfile=true,...request}={}){
 const messages=[],port={postMessage:message=>messages.push(message)};
 snapshotApi.installMarketWorker(port,{loader:{load,clear(){},setNamespace(){},stats(){return {};}}});
 await port.onmessage({data:{id:1,manifest:sourceManifest,base:'https://dashboard.example/data/',filters,includeMitsubishiProfile,...request}});
 const terminal=messages.findLast(message=>message.result||message.error);assert(terminal,'Snapshot worker must return a result or error');assert(!terminal.error,terminal.error);
 return portable(terminal.result);
}
async function ranking(dimension,filters,{sourceManifest=manifest,load=loadCube,...request}={}){
 return portable(await rankingApi.runRanking({filters,dimension,periodA:august,periodB:september,topN:'',manifest:sourceManifest,...request},{loadCube:load}));
}



const viewContext=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'src/evolution-views.js'),'utf8')+';globalThis.api={evolutionSeries,evolutionGrowth,evolutionComposition}',viewContext);const {evolutionSeries,evolutionGrowth,evolutionComposition}=viewContext.api;
(async()=>{
 const filters={date:'2026-09-01..2026-09-30',population:'light',uf:['BA'],marca:['TOYOTA']};
 const result=await snapshot(filters,{includeHistoryComparisons:true,includeMitsubishiProfile:false});
 const market=await snapshot({...filters,marca:'all'},{includeMitsubishiProfile:false});
 const mit=await snapshot({...filters,marca:['MITSUBISHI']},{includeMitsubishiProfile:false});
 assert.equal(result.evolution.market.total,market.total);assert.equal(result.evolution.mitsubishi.total,mit.total);assert(result.total<market.total);
 const series=evolutionSeries(result,['TOYOTA','MITSUBISHI']);assert.equal(series.length,2);assert(series.every(r=>r.denominator===market.total));
 assert.equal(series.find(r=>r.name==='MITSUBISHI').count,mit.total);assert.equal(series.find(r=>r.name==='TOYOTA').count,result.total);
 const mix=evolutionComposition(result.evolution.market);assert.equal(mix.reduce((n,r)=>n+r.count,0),market.total);assert(Math.abs(mix.reduce((n,r)=>n+r.marketShare,0)-1)<1e-12);assert(!mix.some(r=>r.name==='MITSUBISHI'));
 assert(result.evolution.yearAvailable);const prior=await snapshot({...filters,date:'2025-09-01..2025-09-30',marca:'all'},{includeMitsubishiProfile:false});assert.equal(result.evolution.priorYear.total,prior.total);
 const growth=evolutionGrowth(series,evolutionSeries({evolution:{market:result.evolution.priorYear}},['TOYOTA','MITSUBISHI']));assert(growth.every(r=>r.base100===100));assert(growth.every(r=>r.cumulative===r.count));
 // Edge-case fixtures are tests only, never dashboard data.
 const edge=evolutionGrowth([{date:'2026-01-01',name:'A',count:0,marketShare:0},{date:'2026-02-01',name:'A',count:20,marketShare:.2}],[{date:'2025-01-01',name:'A',count:0,marketShare:0},{date:'2025-02-01',name:'A',count:10,marketShare:.1}]);assert.equal(edge[1].base100,null);assert.equal(edge[0].yoy,null);assert.equal(edge[1].yoy,1);assert.equal(edge[1].sharePP,10);
 const gap=evolutionGrowth([{date:'2026-01-01',name:'A',count:null},{date:'2026-02-01',name:'A',count:2}],[]);assert.equal(gap[1].cumulative,null);assert.equal(gap[1].cumulativePrior,null);
 const missing=await snapshot(filters,{includeHistoryComparisons:true,includeMitsubishiProfile:false,sourceManifest:{...manifest,months:manifest.months.filter(m=>m.month!=='2025-09')}});assert.equal(missing.evolution.priorYear,null);
 console.log('Evolution: actual reviewed BA/source counts, benchmark denominator, prior year, complete composition, zero bases, gaps and percentage points PASS');
})().catch(e=>{console.error(e);process.exit(1)});
// Render/control wiring checks without pretending to replace browser visual QA.
{
 let stateOverrides={},states=[];
 const React={useState(initial){const i=states.length;states.push(stateOverrides[i]??initial);return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];}};
 const jsx=(type,props)=>({type,props}),context=vm.createContext({React,jsxRuntime:{jsx,jsxs:jsx,Fragment:'fragment'},dataApp:{Section:'section',SegmentedControl:'tabs',Dropdown:'dropdown'},MarketChart:'chart',MarketTable:'table',LegacyHistoryView:'legacy',number:v=>v==null?'N/D':String(v),percent:v=>v==null?'N/D':String(v*100)+'%',mitsubishiColors:()=>({MITSUBISHI:'red'}),TECHNOLOGY_COLORS:{}});
 vm.runInContext(fs.readFileSync(path.join(root,'src/evolution-views.js'),'utf8')+';globalThis.render=HistoryView',context);
 const monthly=[{date:'2026-09-01',month:'2026-09',count:100}],market={total:100,monthly,groups:{marca:[{name:'TOYOTA',count:50}]},brandsByMonth:[{date:'2026-09-01',name:'TOYOTA',count:50}],propulsionByMonth:[],bodyByMonth:[]},model={evolution:{market,mitsubishi:{...market,total:0}}};
 const nodes=node=>node&&typeof node==='object'?[node,...Object.values(node.props??{}).flatMap(value=>Array.isArray(value)?value.flatMap(nodes):nodes(value))]:[];
 for(const view of ['executive','composition','growth']){
  stateOverrides={0:true};states=[];const tree=context.render({model,scope:[],view}),all=nodes(tree);assert(all.some(n=>n.type==='legacy'));assert(all.some(n=>n.props?.id==='evolution-'+view));const toggle=all.find(n=>n.type==='button'&&n.props.className==='ev-mit');assert(toggle.props['aria-pressed']);toggle.props.onClick();assert.equal(states[0],false);
 }
 console.log('Evolution: all three render paths, persistent legacy view and repeatable Mitsubishi toggle PASS');
}
