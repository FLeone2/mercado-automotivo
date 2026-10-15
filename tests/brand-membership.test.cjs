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

// Test-only facts exercise genuinely mixed labels, brand aliases and zero observations.
// They are never written into the dashboard's reviewed data or production bundle.
function syntheticCube(month,records){
 const columns=['date','marca','modelo','grupo_modelo','segmento','uf','bd_carroceria','bd_segmento','count'];
 const dimensions=columns.slice(0,-1),dictionaries=Object.fromEntries(dimensions.map(d=>[d,[]]));
 const rows=records.map(record=>columns.map(d=>{
  if(d==='count')return record.count;
  const value=record[d]??({date:month+'-12',segmento:'Auto',uf:'SP',bd_carroceria:'SUV',bd_segmento:'MID'}[d]??null);
  let code=dictionaries[d].indexOf(value);if(code<0){code=dictionaries[d].length;dictionaries[d].push(value);}return code;
 }));
 return {month,columns,dimensions,dictionaries,rows};
}

(async()=>{
 const a=await loadCube(manifest.months[0]),b=await loadCube(manifest.months[1]);
 for(const filters of [
  {date:'2026-09-01..2026-09-30',population:'light'},
  {date:'2026-09-01..2026-09-30',population:'light',uf:['SP','RJ'],bd_carroceria:['SUV'],bd_segmento:['COMPACT','MID']},
  {date:'2026-09-01..2026-09-30',population:'light',marca:['TOYOTA','MITSUBISHI','BYD']}
 ]){
  const expectedA=expectedMembership(a,filters,august),expectedB=expectedMembership(b,filters,september),model=await snapshot(filters);
  assert.equal(model.total,expectedB.total);assert.deepEqual(model.brandMembership,expectedB.membership);
  for(const dimension of dimensions){
   assert.equal(Object.values(model.brandMembership[dimension]).reduce((n,counts)=>n+sum(counts),0),model.total);
   for(const row of model.groups[dimension])assert.equal(sum(countsFor(model.brandMembership,dimension,row.name)),row.count);
   const result=await ranking(dimension,filters);
   assert.equal(result.beforeTotal,expectedA.total);assert.equal(result.afterTotal,expectedB.total);
   for(const row of result.rows){
    assert.deepEqual(row.beforeBrandCounts,countsFor(expectedA.membership,dimension,row.brand));
    assert.deepEqual(row.afterBrandCounts,countsFor(expectedB.membership,dimension,row.brand));
    assert.equal(sum(row.beforeBrandCounts),row.beforeCount);assert.equal(sum(row.afterBrandCounts),row.afterCount);
    assert.equal(row.beforeMitsubishiCount,row.beforeBrandCounts.MITSUBISHI??0);assert.equal(row.afterMitsubishiCount,row.afterBrandCounts.MITSUBISHI??0);
    assert.equal(row.afterShare,result.afterTotal?row.afterCount/result.afterTotal:null);
   }
  }
  const without=await snapshot(filters,{includeMitsubishiProfile:false});
  const {brandMembership,mitsubishiProfile,...originalFields}=model;assert.deepEqual(originalFields,without,'Membership collection must not alter original snapshot fields');
  console.log('PASS: exact source brand membership, filtered snapshot and all A/B dimensions; '+model.total+' records.');
 }
 const before=syntheticCube('2026-08',[
  {marca:'MITSUBISHI',modelo:'Shared model',grupo_modelo:'Shared group',count:4},
  {marca:'TOYOTA',modelo:'Shared model',grupo_modelo:'Shared group',count:6},
  {marca:'BYD',modelo:'BYD model',grupo_modelo:'Shared group',count:7},
  {marca:'MITSUBISHI MOTORS',modelo:'Alias model',grupo_modelo:'Alias group',count:3},
  {marca:'MITSUBISHI ',modelo:'Space model',grupo_modelo:'Alias group',count:2},
  {marca:'BYD',modelo:'Heavy model',grupo_modelo:'Heavy group',segmento:'Caminhão',count:90}
 ]);
 const after=syntheticCube('2026-09',[
  {marca:'MITSUBISHI',modelo:'Shared model',grupo_modelo:'Shared group',count:5},
  {marca:'MITSUBISHI',modelo:'Shared model',grupo_modelo:'Shared group',count:2},
  {marca:'TOYOTA',modelo:'Shared model',grupo_modelo:'Shared group',count:9},
  {marca:'BYD',modelo:'BYD model',grupo_modelo:'Shared group',count:8},
  {marca:'BYD',modelo:'BYD model',grupo_modelo:'Shared group',uf:'RJ',count:11},
  {marca:'MITSUBISHI MOTORS',modelo:'Alias model',grupo_modelo:'Alias group',count:1},
  {marca:'MITSUBISHI ',modelo:'Space model',grupo_modelo:'Alias group',count:4},
  {marca:'TOYOTA',modelo:'Zero model',grupo_modelo:'Shared group',count:0},
  {marca:'BYD',modelo:'Heavy model',grupo_modelo:'Heavy group',segmento:'Caminhão',count:100},
  {marca:'__proto__',modelo:'constructor',grupo_modelo:'constructor',count:3},
  {marca:null,modelo:'Unknown model',grupo_modelo:'Unknown group',count:2},
  {marca:'TOYOTA',modelo:'Early model',grupo_modelo:'Shared group',date:'2026-09-03',count:15}
 ]);
 const sourceManifest={months:[before,after].map(cube=>({month:cube.month,cubePath:cube.month+'.json',bdCoverage:true,scope:[{segment:'Auto'},{segment:'Comercial Leve'},{segment:'Caminhão'}]})),expectedMonths:['2026-08','2026-09']};
 const load=async meta=>meta.month==='2026-08'?before:after;
 const filters={date:'2026-09-01..2026-09-30',population:'light'};
 const model=await snapshot(filters,{sourceManifest,load});
 assert.deepEqual(model.brandMembership,expectedMembership(after,filters,september).membership);
 assert.deepEqual(model.brandMembership.modelo['Shared model'],{MITSUBISHI:7,TOYOTA:9});
 assert.deepEqual(model.brandMembership.grupo_modelo['Shared group'],{MITSUBISHI:7,TOYOTA:24,BYD:19});
 assert.deepEqual(model.brandMembership.grupo_modelo['Alias group'],{'MITSUBISHI MOTORS':1,'MITSUBISHI ':4});
 assert.deepEqual(model.brandMembership.modelo['constructor'],JSON.parse('{"__proto__":3}'));
 assert.deepEqual(model.brandMembership.modelo['Unknown model'],{'Não informado':2});
 assert(!Object.hasOwn(model.brandMembership.modelo,'Zero model'));
 assert(!Object.hasOwn(model.brandMembership.modelo,'Heavy model'));
 for(const dimension of dimensions){
  const result=await ranking(dimension,filters,{sourceManifest,load});
  const selected=await ranking(dimension,filters,{sourceManifest,load,highlightBrands:['BYD','MITSUBISHI'],topN:1});
  assert.deepEqual(selected.rows,result.rows,'Display highlighting and Top N must not change membership, rank, totals or shares');
  assert.equal(selected.beforeTotal,result.beforeTotal);assert.equal(selected.afterTotal,result.afterTotal);
  const expectedA=expectedMembership(before,filters,august),expectedB=expectedMembership(after,filters,september);
  for(const row of result.rows){assert.deepEqual(row.beforeBrandCounts,countsFor(expectedA.membership,dimension,row.brand));assert.deepEqual(row.afterBrandCounts,countsFor(expectedB.membership,dimension,row.brand));}
 }
 const mixed=(await ranking('grupo_modelo',filters,{sourceManifest,load})).rows.find(row=>row.brand==='Shared group');
 assert.deepEqual(mixed.beforeBrandCounts,{MITSUBISHI:4,TOYOTA:6,BYD:7});assert.deepEqual(mixed.afterBrandCounts,{MITSUBISHI:7,TOYOTA:24,BYD:19});assert.equal(mixed.mitsubishiExclusive,false);
 const narrowed={...filters,date:'2026-09-10..2026-09-15',uf:['SP'],marca:['BYD','TOYOTA']};
 const narrowedResult=await snapshot(narrowed,{sourceManifest,load});
 assert.deepEqual(narrowedResult.brandMembership.grupo_modelo['Shared group'],{TOYOTA:9,BYD:8});assert.equal(narrowedResult.total,17);
 const allContent=await snapshot({...filters,population:'all_content'},{sourceManifest,load});assert.equal(allContent.brandMembership.modelo['Heavy model'].BYD,100);
 const incomplete={...sourceManifest,expectedMonths:['2026-08','2026-09','2026-10']};
 const unavailable=await ranking('grupo_modelo',filters,{sourceManifest:incomplete,load,periodB:{start:'2026-09-01',end:'2026-10-31'}});
 assert.equal(unavailable.afterTotal,null);assert.equal(unavailable.periodB.complete,false);
 assert.deepEqual(unavailable.rows.find(row=>row.brand==='Shared group').afterBrandCounts,mixed.afterBrandCounts,'Incomplete periods retain observed membership without inventing missing observations');
 console.log('PASS: mixed brands/model groups, exact aliases, zero/missing labels, prototype-safe keys, all filters, display independence and incomplete-period semantics.');
})().catch(error=>{console.error(error);process.exitCode=1;});
