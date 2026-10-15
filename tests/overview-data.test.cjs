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
const manifest={...completeManifest,expectedMonths:['2026-08','2026-09'],months:completeManifest.months.filter(m=>['2026-08','2026-09'].includes(m.month))};
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


(async()=>{
 const filters={date:'2026-09-01..2026-09-30',population:'light'},cube=await loadCube(manifest.months.find(m=>m.month==='2026-09'));
 const national=await snapshot(filters,{includeMitsubishiProfile:false});
 assert.equal(national.total,268721);assert.equal(national.groups.uf.reduce((n,r)=>n+r.count,0),national.total);
 for(const uf of ['BA','SP']){
  const selected=await snapshot({...filters,uf,municipio:'all'},{includeMitsubishiProfile:false});
  assert.equal(selected.total,expectedMembership(cube,{...filters,uf},september).total);
  assert.equal(national.groups.uf.find(r=>r.name===uf).count,selected.total);
  assert.equal(selected.groups.marca.reduce((n,r)=>n+r.count,0),selected.total);
  assert(selected.groups.uf.every(r=>r.name===uf));
  const mit=selected.groups.marca.find(r=>r.name==='MITSUBISHI');
  if(mit)assert.equal(mit.marketShare,mit.count/selected.total);
  console.log(`PASS: real ${uf} September total ${selected.total}; national hover baseline and selected brands/Mitsubishi shares agree.`);
 }
 const scoped=await snapshot({...filters,marca:['MITSUBISHI','TOYOTA'],uf:'all',municipio:'all'},{includeMitsubishiProfile:false});
 assert.equal(scoped.total,expectedMembership(cube,{...filters,marca:['MITSUBISHI','TOYOTA']},september).total);
 assert(scoped.total<national.total);console.log('PASS: map national context preserves non-geographic filters and all real-source totals.');
})().catch(e=>{console.error(e);process.exitCode=1;});
