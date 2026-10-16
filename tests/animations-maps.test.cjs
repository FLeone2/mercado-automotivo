// Exact-value and geometry behavior tests; these are not a browser screenshot claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),national=JSON.parse(JSON.parse(html.match(/const value\$3 = JSON.parse\(("(?:[^"\\]|\\.)*")\)/)[1]));
const geometries=new Map(national.features.map(feature=>[feature.uf,JSON.parse(read('data/geography/'+feature.uf+'.json'))]));
let slots=[],cursor=0,geometryMode='ready',retryCount=0;
const jsx=(type,props,key)=>({type,props:props??{},key});
const React={Fragment:'fragment',useMemo:fn=>fn(),useEffect:()=>{},useId:()=>':animation-test:',useState:initial=>{const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],value=>slots[index]=typeof value==='function'?value(slots[index]):value];}};
const context=vm.createContext({React,jsxRuntime:{jsx,jsxs:jsx},value$3:national,MarketTable:'market-table',Map,Set,Math,Number,String,Array,Object,Intl});
vm.runInContext(read('src/catalog-maps.js'),context);
context.useCatalogMunicipalGeometry=(uf,base,enabled)=>({data:enabled&&geometryMode==='ready'?geometries.get(uf)??null:null,pending:geometryMode==='pending',error:geometryMode==='error'?'Malha municipal indisponível.':null,retry:()=>retryCount++});
vm.runInContext(read('src/animations-maps.js')+';globalThis.api={AnimationMaps,animationMapTechnology,animationMapMetric,animationMapFrameList,animationMapCurrentFrame,animationMapTechnologyCount,animationMapStandardRow,animationMapStateRows,animationMapMunicipalSource,animationMapMunicipalRows,animationMapDomains,animationMapColor,animationMapViewBox};',context);
const api=context.api,plain=value=>JSON.parse(JSON.stringify(value));
function nodes(tree,result=[]){if(!tree||typeof tree!=='object')return result;result.push(tree);for(const child of [tree.props?.children].flat(Infinity))nodes(child,result);return result;}
function text(tree){return nodes(tree).flatMap(node=>[node.props?.children].flat(Infinity).filter(child=>typeof child==='string'||typeof child==='number')).join(' ');}
function table(tree){return nodes(tree).find(node=>node.type==='market-table');}
function render(props){cursor=0;return api.AnimationMaps(props);}
const uf=(name,count,mitCount,technologyCounts)=>({name,uf:name,count,total:count,marketCount:count,mitCount,technologyCounts,unclassifiedCount:technologyCounts?.['Não classificado']??0});
const city=(name,count,ufName='SP')=>({...uf(name+' · '+ufName,count,Math.floor(count/10),{BEV:Math.floor(count/5)}),uf:ufName,municipality:name,observedCount:count});
const frames=[{month:'2026-01',date:'2026-01-01',complete:true,coverageStatus:'complete',mode:'monthly',selectedUF:'SP',municipalityRequested:true,ufRows:[uf('SP',100,5,{BEV:10,PHEV:8,HEV:6,MHEV:4,FCEL:2,ICE:60,'Não classificado':10}),uf('RJ',10,0,{ICE:10})],municipalityRows:[city('SÃO PAULO',25),city('Campinas',100),city('Sem vínculo',7)]},
 {month:'2026-02',complete:true,coverageStatus:'complete',mode:'monthly',selectedUF:'SP',municipalityRequested:true,ufRows:[uf('SP',200,40,{BEV:50,PHEV:10,HEV:10,MHEV:10,ICE:120})],municipalityRows:[city('São Paulo',100),city('Campinas',400)]}];
const base={frames,frame:0,metric:'mitShare',technology:'BEV',uf:'SP',dataBase:'https://example.com/data/'};
assert.equal(api.animationMapTechnology('all'),'ALL_ELECTRIFIED');assert.equal(api.animationMapTechnology('FCEL'),null);assert.equal(api.animationMapTechnology('BEV'),'BEV');
assert.equal(api.animationMapTechnologyCount(frames[0].ufRows[0],'ALL_ELECTRIFIED'),28,'Explicit electrified definition excludes FCEL');
assert.equal(api.animationMapTechnologyCount(frames[0].ufRows[0],'BEV'),10);assert.equal(api.animationMapTechnologyCount({technologyCounts:{}},'BEV'),0);assert.equal(api.animationMapTechnologyCount({},'BEV'),null);
assert.equal(api.animationMapCurrentFrame({frames},1),frames[1]);assert.equal(api.animationMapCurrentFrame(frames,'2026-01'),frames[0]);assert.equal(api.animationMapCurrentFrame(frames,99),null);
assert.equal(api.animationMapStateRows(frames[0],'BEV').length,27);
const states=api.animationMapStateRows(frames[0],'BEV');assert.equal(states.find(row=>row.uf==='SP').mitShare,.05);assert.equal(states.find(row=>row.uf==='SP').technologyShare,.1);assert.equal(states.find(row=>row.uf==='RJ').mitShare,0);assert.equal(states.find(row=>row.uf==='AC').count,0);assert.equal(states.find(row=>row.uf==='AC').mitShare,null,'Zero denominator is unknown, not zero share');
const falseShare={...frames[0],ufRows:[{...frames[0].ufRows[0],mitShare:.99}]};assert.equal(api.animationMapStateRows(falseShare,'BEV')[0].uf,national.features[0].uf);assert.equal(api.animationMapStateRows(falseShare,'BEV').find(row=>row.uf==='SP').mitShare,.05,'Share always uses exact numerator and denominator');
const incomplete={...frames[0],complete:false,coverageStatus:'partial',ufRows:[{...frames[0].ufRows[0],observedCount:44}],municipalityRows:[{...city('São Paulo',25),observedCount:25}]};
assert(api.animationMapStateRows(incomplete,'BEV').every(row=>row.count===null&&row.mitShare===null&&row.technologyShare===null));assert.equal(api.animationMapStateRows(incomplete,'BEV').find(row=>row.uf==='SP').observedCount,44);
assert(api.animationMapStateRows({month:'2026-03',complete:true},'BEV').every(row=>row.count===null),'Missing aggregation is never interpreted as zero');
assert.equal(api.animationMapStateRows({...frames[0],ufRows:[...frames[0].ufRows,uf('UF desconhecida',3,1,{})]},'BEV').length,28,'Unmapped UF source rows are preserved');
const mitDomain=api.animationMapDomains(frames,'mitShare','BEV','SP');assert.equal(mitDomain.max,.2);
assert.equal(api.animationMapDomains(frames,'electrification','BEV','SP').max,.25);assert.equal(api.animationMapDomains(frames,'municipalVolume','BEV','SP').max,400);
let tree=render(base);assert.equal(nodes(tree).filter(node=>node.props.className==='anm-map-state').length,27);assert.equal(table(tree).props.rows.length,27);assert.equal(nodes(tree).find(node=>node.props.className==='anm-map-svg').props['data-domain-max'],.2);
const rawSP=national.features.find(feature=>feature.uf==='SP');assert.equal(nodes(tree).find(node=>node.props['data-uf']==='SP').props.d,rawSP.path,'Exact official state path');
const sp=nodes(tree).find(node=>node.props['data-uf']==='SP');sp.props.onClick();tree=render(base);assert(text(tree).includes('Participação MIT: 5,00%'));
let prevented=false;sp.props.onKeyDown({key:' ',preventDefault(){prevented=true;}});assert(prevented,'Keyboard activation');sp.props.onKeyDown({key:'Escape'});
const after=render({...base,frame:1});assert.equal(nodes(after).find(node=>node.props.className==='anm-map-svg').props['data-domain-max'],.2,'Color domain does not change with frame');
for(const technology of ['BEV','PHEV','HEV','MHEV','ALL_ELECTRIFIED']){tree=render({...base,metric:'electrification',technology});const row=table(tree).props.rows.find(row=>row.uf==='SP');assert.equal(row.technologyShare,({BEV:10,PHEV:8,HEV:6,MHEV:4,ALL_ELECTRIFIED:28})[technology]/100);assert(!JSON.stringify(tree).includes('NaN'));}
tree=render({...base,metric:'electrification',technology:'unsupported'});assert(table(tree).props.rows.every(row=>row.technologyShare===null));assert(text(tree).includes('Tecnologia não reconhecida'));
const cities=api.animationMapMunicipalRows(frames[0],'SP',geometries.get('SP'),'BEV');assert.equal(cities.rows.length,646);assert.equal(cities.unmatched.length,1);assert.equal(cities.rows.reduce((sum,row)=>sum+row.count,0),132,'No source registration is dropped by geography join');
const sao=cities.rows.find(row=>row.ibgeCode==='3550308');assert.equal(sao.count,25);assert.equal(sao.municipality,'São Paulo');assert(Number.isFinite(sao.x)&&Number.isFinite(sao.y));assert.equal(cities.unmatched[0].ibgeCode,null);assert.equal(cities.unmatched[0].path,null);assert.equal(cities.unmatched[0].x,null,'Never fabricate point for unknown name');
assert(api.animationMapMunicipalRows(incomplete,'SP',geometries.get('SP'),'BEV').rows.every(row=>row.count===null));
assert(api.animationMapMunicipalRows(frames[0],'RJ',geometries.get('RJ'),'BEV').rows.every(row=>row.count===null),'Stale different-UF frames never create confirmed zeros');
assert.equal(api.animationMapMunicipalSource({...frames[0],selectedUF:'',municipalityRequested:false,municipalityRows:[]},'SP').ready,false);
assert.equal(api.animationMapMunicipalRows({...frames[0],municipalityRows:[]},'SP',geometries.get('SP'),'BEV').rows.length,645);assert(api.animationMapMunicipalRows({...frames[0],municipalityRows:[]},'SP',geometries.get('SP'),'BEV').rows.every(row=>row.count===0),'Explicit complete selected UF can be zero-filled');
for(const [state,geometry] of geometries){const empty={month:'2026-01',selectedUF:state,complete:true,municipalityRows:[]};const result=api.animationMapMunicipalRows(empty,state,geometry,'BEV');assert.equal(result.rows.length,geometry.features.length);assert(result.rows.every(row=>row.count===0&&row.path));}
slots=[];tree=render({...base,metric:'municipalVolume'});assert.equal(nodes(tree).filter(node=>node.props.className==='anm-map-city').length,645);assert.equal(nodes(tree).filter(node=>node.props.className==='anm-map-bubble').length,2);assert.equal(table(tree).props.rows.length,646);
const bubble=(tree,name)=>nodes(tree).find(node=>node.props['data-municipality']===name).props.children[0].props;
const radius1=bubble(tree,'São Paulo · SP').r;tree=render({...base,metric:'municipalVolume',frame:1});const radius2=bubble(tree,'São Paulo · SP').r;assert.equal(radius1*radius1/(radius2*radius2),.25,'Bubble area, not radius, encodes volume with a fixed window domain');
assert.equal(nodes(tree).find(node=>node.props.className==='anm-map-svg').props['data-domain-max'],400);
const query=nodes(tree).find(node=>node.props['aria-label']==='Buscar na tabela do mapa animado');query.props.onChange({target:{value:'SAO PAULO'}});tree=render({...base,metric:'municipalVolume'});assert.equal(table(tree).props.rows.length,1,'Accessible table search normalizes accents');slots=[];
geometryMode='error';tree=render({...base,metric:'municipalVolume'});assert.equal(table(tree).props.rows.length,3,'Geometry load failure preserves complete source table');assert(!nodes(tree).some(node=>node.props.className==='anm-map-svg'));nodes(tree).find(node=>node.type==='button'&&node.props.children==='Tentar carregar a malha novamente').props.onClick();assert.equal(retryCount,1);geometryMode='ready';
tree=render({...base,metric:'municipalVolume',uf:''});assert(text(tree).includes('Escolha uma única UF'));assert(!nodes(tree).some(node=>node.props.className==='anm-map-svg'));
tree=render({...base,frames:[incomplete],metric:'municipalVolume'});assert.equal(nodes(tree).filter(node=>node.props.className==='anm-map-bubble').length,0,'Partial monthly volume is never drawn as a complete bubble');assert(table(tree).props.rows.every(row=>row.count===null));assert(table(tree).props.rows.some(row=>row.observedCount===25));
tree=render({...base,frame:100});assert(text(tree).includes('Nenhum quadro disponível'));assert(table(tree).props.rows.every(row=>row.count===null));
assert.equal(api.animationMapViewBox('0 0 600 400'),'−32 −32 664 464'.replaceAll('−','-'));
assert(read('src/animations-maps.css').includes('prefers-reduced-motion'));
console.log('PASS animation maps: 27 official UF paths; all municipal geometries; exact MIT/technology ratios; explicit BEV/PHEV/HEV/MHEV sum; fixed color/area domains; zero versus unavailable; stale-UF guard; unmatched conservation; accessible table/search/keyboard; geometry retry.');

// Verify the component's measures against real bundled monthly source cubes.
const A=require('../src/animations-data.js'),zlib=require('node:zlib'),manifest=JSON.parse(read('data/manifest.json'));
const realFrames=['2026-08','2026-09'].map(month=>{
 const meta=manifest.months.find(meta=>meta.month===month);assert(meta?.cubePath,'Bundled month required: '+month);
 const cube=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data',meta.cubePath))));
 return A.aggregateCube(cube,meta,{filters:{population:'light'},selectedUF:'SP',preset:'all',dimension:'marca'});
});
for(const frame of realFrames){
 const stateRows=api.animationMapStateRows(frame,'ALL_ELECTRIFIED');
 assert.equal(stateRows.reduce((sum,row)=>sum+row.count,0),frame.total,'Real UF totals conserve monthly registrations');
 for(const row of stateRows){if(row.marketCount>0){assert.equal(row.mitShare,row.mitCount/row.marketCount);assert.equal(row.technologyShare,row.technologyCount/row.marketCount);}}
 const municipal=api.animationMapMunicipalRows(frame,'SP',geometries.get('SP'),'ALL_ELECTRIFIED');
 assert.equal(municipal.rows.reduce((sum,row)=>sum+row.count,0),stateRows.find(row=>row.uf==='SP').count,'Real municipality join conserves the whole UF volume');
 assert(municipal.matches.filter(row=>row.count>0).every(row=>Number.isFinite(row.x)&&Number.isFinite(row.y)));
}
const realDomain=api.animationMapDomains(realFrames,'mitShare','ALL_ELECTRIFIED','SP');
for(let frame=0;frame<realFrames.length;frame++){const tree=render({...base,frames:realFrames,frame});assert.equal(nodes(tree).find(node=>node.props.className==='anm-map-svg').props['data-domain-max'],realDomain.max);assert(!JSON.stringify(tree).includes('NaN'));}
const missingTechnology={...frames[0],technologyAvailable:false};assert(api.animationMapStateRows(missingTechnology,'BEV').every(row=>row.technologyCount===null&&row.technologyShare===null),'Missing technology source is unavailable, not zero');
const duplicateNames={...frames[0],municipalityRows:[city('SAO PAULO',200),city('São Paulo',300)]};const combined=api.animationMapMunicipalRows(duplicateNames,'SP',geometries.get('SP'),'BEV');assert.equal(combined.rows.find(row=>row.ibgeCode==='3550308').count,500);assert.equal(api.animationMapDomains([duplicateNames],'municipalVolume','BEV','SP').max,500,'Fixed area domain accounts for the same normalized join aggregation');
console.log('PASS real-source animation maps: August/September 2026 UF totals, exact shares, full SP municipal volume conservation, stable playback domain, missing-technology guard, normalized-name aggregation.');
