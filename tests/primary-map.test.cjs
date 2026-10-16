// Independent source/handler regressions. These do not claim rendered-browser QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),population=JSON.parse(read('data/geography/catalog-population.json'));
const nationalGeometry=JSON.parse(JSON.parse(html.match(/const value\$3 = JSON.parse\(("(?:[^"\\]|\\.)*")\)/)[1]));
const stateGeometry=new Map(nationalGeometry.features.map(f=>[f.uf,JSON.parse(read('data/geography/'+f.uf+'.json'))]));
assert.equal(stateGeometry.size,27);
let municipalityCount=0;
for(const [uf,geo] of stateGeometry){
 assert.equal(geo.uf,uf);assert.equal(new Set(geo.features.map(f=>f.code)).size,geo.features.length);
 const [x,y,w,h]=geo.viewBox.split(/\s+/).map(Number);assert(w>0&&h>0);
 for(const f of geo.features){
  assert.equal(f.uf,uf);assert(/^\d{7}$/.test(f.code));
  const coords=[...f.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)];assert(coords.length>=3);
  for(const c of coords){assert(+c[1]>=x-.1&&+c[1]<=x+w+.1,uf+' x bounds '+f.code);assert(+c[2]>=y-.1&&+c[2]<=y+h+.1,uf+' y bounds '+f.code);}
 }
 municipalityCount+=geo.features.length;
 const expected=population.municipalities.filter(r=>r.uf===uf).reduce((sum,r)=>sum+r.population,0);
 assert.equal(population.states.find(r=>r.name===uf).population2026,expected,'Full fixed population for '+uf);
}
assert.equal(municipalityCount,5570);assert.equal(population.municipalities.length,5571);
assert.equal(population.states.reduce((sum,r)=>sum+r.population2026,0),214211951);
const source=read('src/primary-map.js');
let slots=[],cursor=0;
const jsx=(type,props,key)=>({type,props:props??{},key});
const React={useMemo:fn=>fn(),useEffect:()=>{},useRef:v=>({current:v}),useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];}};
const context=vm.createContext({React,jsxRuntime:{jsx,jsxs:jsx},value$3:nationalGeometry,MarketTable:'market-table',number:v=>v==null?'—':String(v),percent:v=>v==null?'—':String(v*100)+'%',console,Map,Set,Math,Number,String,Array,Intl});
const authored=html.slice(html.indexOf('(function(module,exports,require){')+'(function(module,exports,require){'.length,html.indexOf('})(__dataAuthoredModule,__dataAuthoredModule.exports,__dataAuthoredRequire)'));
const authoredApi=new Function('require','exports',authored+';return {mapAnalysis,dealerMarkers};')(name=>name==='react'?React:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:new Proxy({},{get:(_,key)=>key}),{});
Object.assign(context,authoredApi);
vm.runInContext(read('src/catalog-maps.js'),context);
context.useCatalogMunicipalGeometry=(uf)=>({data:stateGeometry.get(uf)??null,pending:false,error:null,retry:()=>{}});
context.useCatalogPopulation=()=>({data:population,pending:false,error:null,retry:()=>{}});
vm.runInContext(source+';globalThis.api={PrimaryMap,primaryMapRows,primaryMapMunicipalRows,PRIMARY_MAP_BUBBLE_LIMIT};',context);
const api=context.api;
const plain=v=>JSON.parse(JSON.stringify(v));
function nodes(tree,result=[]){if(!tree||typeof tree!=='object')return result;result.push(tree);for(const c of [tree.props?.children].flat(Infinity))nodes(c,result);return result;}
function text(tree){return nodes(tree).flatMap(n=>[n.props?.children].flat(Infinity).filter(c=>typeof c==='string'||typeof c==='number')).join(' ');}
const model={total:30,complete:true,groups:{uf:[{name:'SP',count:30}],municipio:[{name:'São Paulo · SP',count:30}]},catalog:{market:{total:100,complete:true,groups:{uf:[{name:'SP',count:100}],municipio:[{name:'São Paulo · SP',count:100}]}}}};
const baseFilters={uf:['SP'],municipio:[],tipo_venda:'all'},changes=[];
let view={metric:'count',showDealers:false,detail:null};
let props={id:'test-primary',model,filters:baseFilters,scope:[],dataBase:'https://example.com/data/',view,setView:next=>{view=typeof next==='function'?next(view):next;props.view=view;},setFilter:(field,value)=>changes.push([field,value])};
function render(){cursor=0;return api.PrimaryMap(props);}
let tree=render();
const table=t=>nodes(t).find(n=>n.type==='market-table');
const control=(t,label)=>nodes(t).find(n=>n.props['aria-label']===label);
const button=(t,label)=>nodes(t).find(n=>n.type==='button'&&n.props.children===label);
assert.equal(table(tree).props.rows.length,645,'SP full municipal list');
assert.equal(nodes(tree).filter(n=>n.props.className==='pm-city').length,645);
const city=t=>nodes(t).find(n=>n.props.className==='pm-city'&&n.props['aria-label'].startsWith('São Paulo · SP'));
city(tree).props.onClick();tree=render();assert.equal(changes.length,0,'City click must never apply a filter');assert.equal(view.detail,'São Paulo · SP');
assert(button(tree,'Filtrar por este município'));assert(text(tree).includes('Detalhes fixados'));
const other=nodes(tree).find(n=>n.props.className==='pm-city'&&!n.props['aria-pressed']);other.props.onMouseEnter();tree=render();assert.equal(view.detail,'São Paulo · SP');assert.equal(city(tree).props['aria-pressed'],true,'Hover preserves pinned city');
other.props.onFocus();tree=render();assert.equal(view.detail,'São Paulo · SP');assert.equal(changes.length,0,'Hover/focus never filters');
button(tree,'Filtrar por este município').props.onClick();assert.deepEqual(changes,[['municipio','São Paulo']]);
let prevented=false;city(tree).props.onKeyDown({key:'Escape',preventDefault(){}});tree=render();assert.equal(view.detail,null);assert(!button(tree,'Filtrar por este município'));
city(tree).props.onKeyDown({key:' ',preventDefault(){prevented=true;}});tree=render();assert(prevented);assert.equal(view.detail,'São Paulo · SP');assert.equal(changes.length,1);
button(tree,'Fechar detalhes').props.onClick();tree=render();assert.equal(view.detail,null);
table(tree).props.onSelect(table(tree).props.rows[0]);tree=render();assert(view.detail);assert.equal(changes.length,1,'Full table opens details without filtering');
for(const metric of ['count','share','per1000']){control(tree,'Medida do mapa principal').props.onChange({target:{value:metric}});tree=render();assert.equal(view.metric,metric);assert(!JSON.stringify(tree).includes('NaN'));}
const sp=table(tree).props.rows.find(r=>r.name==='São Paulo · SP');assert.equal(sp.count,30);assert.equal(sp.share,.3);assert.equal(sp.per1000,30/sp.population2026*1000);
control(tree,'Buscar município na lista completa').props.onChange({target:{value:'SAO PAULO'}});tree=render();assert.equal(table(tree).props.rows.length,1,'Search normalizes accents');
control(tree,'Buscar município na lista completa').props.onChange({target:{value:''}});
props.pending=true;tree=render();const before=view.detail;city(tree).props.onClick();assert.equal(view.detail,before);assert.equal(city(tree).props.tabIndex,-1);props.pending=false;
props.filters={uf:[],tipo_venda:'all'};view.detail=null;tree=render();assert.equal(table(tree).props.rows.length,27);assert.equal(nodes(tree).filter(n=>n.props.className==='pm-state').length,27);
control(tree,'Explorar UF').props.onChange({target:{value:'BA'}});assert.deepEqual(changes.at(-1),['uf','BA']);
const bahia=nodes(tree).find(n=>n.props['data-uf']==='BA');bahia.props.onKeyDown({key:'Enter',preventDefault(){}});assert.deepEqual(changes.at(-1),['uf','BA']);
console.log('PASS primary-map actual handlers: city details, explicit filter, hover/focus, keyboard, pending guard, all UFs, full SP table, metrics, search.');
for(const [uf,geo] of stateGeometry){
 const rows=api.primaryMapMunicipalRows([],geo,population,true,uf);
 const expected=population.municipalities.filter(r=>r.uf===uf);
 for(const p of expected)assert(rows.some(r=>String(r.ibgeCode)===p.code),'All official population municipalities appear: '+uf+' '+p.code);
 assert.equal(new Set(rows.map(r=>r.ibgeCode)).size,rows.length,'No duplicate IBGE rows: '+uf);
 assert(rows.every(r=>r.count===0));
 const partial=api.primaryMapMunicipalRows([],geo,population,false,uf);assert(partial.every(r=>r.count===null&&r.per1000===null),'Missing coverage never becomes zero '+uf);
}
const many=stateGeometry.get('SP').features.map((f,i)=>({name:f.name+' · SP',count:i+1}));
props.model={total:many.reduce((s,r)=>s+r.count,0),complete:true,groups:{uf:[{name:'SP',count:many.reduce((s,r)=>s+r.count,0)}],municipio:many},catalog:{market:{total:1000000,complete:true,groups:{uf:[{name:'SP',count:1000000}],municipio:many.map(r=>({...r,count:r.count*2}))}}}};
props.filters={uf:['SP'],tipo_venda:'all'};view.metric='count';view.detail=null;tree=render();
assert.equal(table(tree).props.rows.length,645);assert.equal(nodes(tree).filter(n=>n.props.className==='pm-bubble').length,150,'Only drawing capped, never data list');
const smallest=table(tree).props.rows.find(r=>r.count===1);table(tree).props.onSelect(smallest);tree=render();assert(nodes(tree).some(n=>n.props['data-municipality']===smallest.name),'Pinned city outside top 150 is represented');assert.equal(nodes(tree).filter(n=>n.props.className==='pm-bubble').length,150);
const unmatched=api.primaryMapMunicipalRows([{name:'Unmatched test city · SP',count:7}],stateGeometry.get('SP'),population,true,'SP');assert(unmatched.some(r=>r.name==='Unmatched test city · SP'&&r.count===7));
const mt=api.primaryMapMunicipalRows([],stateGeometry.get('MT'),population,true,'MT');const boundary=mt.find(r=>r.ibgeCode==='5101837');assert(boundary);assert.equal(boundary.per1000,null,'Unvalidated new boundary never gets unsupported rate');
console.log('PASS full 27-UF municipal lists including population-only municipality, zero/unknown distinctions, 150-bubble cap with selected-city recovery, unmatched rows, fixed 2026 rates.');
// Run the real worker over a bundled month, then inspect the shared map's measures.
const zlib=require('node:zlib'),{webcrypto}=require('node:crypto');
const workerContext=vm.createContext({console,DOMException,TextEncoder,TextDecoder,URL,AbortController,crypto:webcrypto,setTimeout});
vm.runInContext(read('src/evolution-market-worker.js').replace(/\}\)\(\);\s*$/,'globalThis.api={installMarketWorker};})();'),workerContext);
const manifest=JSON.parse(read('data/manifest.json'));manifest.months=manifest.months.filter(m=>m.month==='2026-09');manifest.expectedMonths=['2026-09'];
async function actual(filters){const messages=[],port={postMessage:m=>messages.push(m)};workerContext.api.installMarketWorker(port,{loader:{load:async meta=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data',meta.cubePath)))),setNamespace(){},clear(){},stats(){return {};}}});await port.onmessage({data:{id:1,manifest,base:'https://example.com/data/',filters,includeCatalog:true,includeChannelReference:true}});const result=messages.findLast(m=>m.result||m.error);assert(result&&!result.error,result?.error);return result.result;}
(async()=>{
 const filters={date:'2026-09',population:'light'};
 const real=await actual(filters);assert.equal(real.total,268721);const analysis=authoredApi.mapAnalysis(real,filters);const rows=api.primaryMapRows(real,'uf',analysis);assert.equal(rows.reduce((s,r)=>s+r.count,0),268721);
 props.model=real;props.filters=filters;view.metric='per1000';view.detail=null;tree=render();
 for(const row of table(tree).props.rows){const pop=population.states.find(r=>r.name===row.name);assert.equal(row.population2026,pop.population2026);assert.equal(row.per1000,row.count/pop.population2026*1000);}
 assert.equal(table(tree).props.rows.reduce((s,r)=>s+r.population2026,0),214211951);
 // Actual geometry calls Salvador a title-case display name; source filter remains SALVADOR.
 props.model=real;props.filters={...filters,uf:'BA'};view.detail=null;view.metric='count';tree=render();
 const salvador=table(tree).props.rows.find(r=>r.name==='SALVADOR · BA');assert(salvador&&salvador.count>0);
 assert.equal(salvador.municipality,'Salvador');const beforeSalvador=changes.length;
 table(tree).props.onSelect(salvador);tree=render();assert.equal(changes.length,beforeSalvador,'Inspecting Salvador does not filter');
 button(tree,'Filtrar por este município').props.onClick();assert.deepEqual(changes.at(-1),['municipio','SALVADOR']);
 const selected=await actual({...filters,uf:'BA',municipio:changes.at(-1)[1]});
 assert.equal(selected.total,salvador.count);assert.equal(selected.daily.reduce((s,r)=>s+r.count,0),salvador.count);
 props.filters=filters;view.detail=null;
 const mit=await actual({...filters,marca:'MITSUBISHI'});assert.equal(mit.total,1729);const mitRows=api.primaryMapRows(mit,'uf',authoredApi.mapAnalysis(mit,filters));for(const row of mitRows){if(row.marketCount>0)assert.equal(row.share,row.count/row.marketCount);}
 props.model=mit;tree=render();assert.equal(table(tree).props.rows.reduce((s,r)=>s+r.population2026,0),214211951,'Brand filter never restricts population denominator');
 const vdFilters={...filters,tipo_venda:'VD'};const vd=await actual(vdFilters),vdAnalysis=authoredApi.mapAnalysis(vd,vdFilters);assert(vdAnalysis.canShare);const vdRows=api.primaryMapRows(vd,'uf',vdAnalysis);for(const row of vdRows){if(row.denominator>0)assert.equal(row.channelShare,row.count/row.denominator);}
 props.model=vd;props.filters=vdFilters;view.metric='channelShare';tree=render();assert.equal(table(tree).props.rows.length,27);assert(table(tree).props.columns.some(c=>c.field==='denominator'));
 const incomplete={...vd,complete:false};const partialRows=api.primaryMapRows(incomplete,'uf',authoredApi.mapAnalysis(incomplete,vdFilters));assert(partialRows.every(r=>r.channelShare===null&&r.share===null));
 props.model=incomplete;view.metric='per1000';tree=render();assert(table(tree).props.rows.every(r=>r.per1000===null));
 console.log('PASS real September worker→primary map: 268,721 national, 1,729 Mitsubishi, selection/channel shares, full fixed-2026 denominator invariance, incomplete-coverage null rates.');
})().catch(error=>{console.error(error);process.exitCode=1;});
for(const [uf] of stateGeometry){const fallback=api.primaryMapMunicipalRows([],null,population,true,uf);assert.equal(fallback.length,population.municipalities.filter(r=>r.uf===uf).length,'Full fallback list without geometry '+uf);}
context.value$2=JSON.parse(JSON.parse(html.match(/const value\$2 = JSON.parse\(("(?:[^"\\]|\\.)*")\)/)[1]));
props.filters={uf:['SP'],tipo_venda:'all'};view.showDealers=true;tree=render();const dealers=nodes(tree).filter(n=>n.props.className==='pm-dealer');assert(dealers.length>0);const beforeDealer=changes.length;dealers[0].props.onClick();tree=render();assert.equal(changes.length,beforeDealer,'Dealer opens city details without changing filter');assert(view.detail);assert(text(tree).includes('Rede Mitsubishi'));
const checked=nodes(tree).find(n=>n.type==='input'&&n.props.type==='checkbox');checked.props.onChange({target:{checked:false}});tree=render();assert.equal(nodes(tree).filter(n=>n.props.className==='pm-dealer').length,0);
console.log('PASS all27 no-geometry fallback lists and actual dealer geometry/inspection/toggle.');
