const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const D=require('../src/animations-data.js'),C=require('../src/animations-charts.js'),manifest=JSON.parse(fs.readFileSync('data/manifest.json','utf8'));
const frames=['2025-09','2026-09'].map(month=>{const meta=manifest.months.find(m=>m.month===month),cube=JSON.parse(zlib.gunzipSync(fs.readFileSync('data/'+meta.originCubePath)));return D.aggregateCube(cube,meta,{filters:{population:'light'},dimension:'marca',selectedUF:'SP',preset:'all'});});
const compared=D.attachYoY(frames);let slots=[],cursor=0,lastRequest=null,exported=null,seeked=null;
const jsx=(type,props,key)=>({type,props:props??{},key});
const context=vm.createContext({React:{useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];}},jsxRuntime:{jsx,jsxs:jsx,Fragment:'fragment'},dataApp:{useDataApp:()=>({snapshot:{marketDataBase:'https://example.test/data/'}})},getBase:()=> 'https://example.test/data/',canonicalFilterKey:filters=>JSON.stringify(filters),AnimationCharts:C,AnimationRace:C.AnimationRace,AnimationBubbles:C.AnimationBubbles,AnimationMix:C.AnimationMix,AnimationLeadership:C.AnimationLeadership,AnimationMaps:()=>null,download:(name,rows)=>exported={name,rows},console});
vm.runInContext(fs.readFileSync('src/performance-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/animations.js','utf8'),context);
context.useAnimationQuery=request=>{lastRequest=request;return {pending:false,result:{frames:compared,notes:[]}};};
context.useAnimationPlayer=()=>({index:1,playing:false,speed:1000,reduced:false,setSpeed:()=>{},seek:i=>seeked=i,toggle:()=>{}});
const filters={population:'light',date:'2026-09',marca:['MITSUBISHI'],uf:['SP']};
function walk(node,out=[]){if(!node||typeof node!=='object')return out;out.push(node);for(const c of [node.props?.children].flat(Infinity))walk(c,out);return out;}
function render(changes={}){for(const [i,v]of Object.entries(changes))slots[+i]=v;cursor=0;return walk(context.AnimationWorkspace({manifest,filters,scope:[]}));}
let tree=render();assert.equal(lastRequest.startMonth,'2024-10');assert.equal(lastRequest.endMonth,'2026-09');assert.equal(lastRequest.mode,'monthly');assert.deepEqual(lastRequest.filters.marca,['MITSUBISHI']);assert(!('date'in lastRequest.filters));
for(const view of ['races','bubbles','mix','maps']){
 tree=render({0:view});assert.equal(lastRequest.dataView,view,'Every UI request must opt into bounded view projection');assert(tree.some(n=>n.type==={races:C.AnimationRace,bubbles:C.AnimationBubbles,mix:C.AnimationMix,maps:context.AnimationMaps}[view]));
 const exportButton=tree.find(n=>n.type==='button'&&n.props.children==='Exportar valores de todos os meses · CSV');assert(exportButton);exportButton.props.onClick();assert(exported.rows.length);assert(exported.rows.every(row=>row.month&&row.parameters&&row.universe>0));assert.equal(JSON.parse(exported.rows[0].parameters).view,view);
}
tree=render({0:'races',2:'uf'});let race=tree.find(n=>n.type===C.AnimationRace),lead=tree.find(n=>n.type===C.AnimationLeadership);assert.equal(race.props.metric,'mitCount');assert.equal(lead.props.metric,'mitCount');lead.props.onSelect(0);assert.equal(seeked,0);
tree.find(n=>n.type==='button'&&n.props.children==='Exportar valores de todos os meses · CSV').props.onClick();assert(exported.rows.every(r=>r.rank!=null&&r.leadershipMargin!==undefined));assert.equal(JSON.parse(exported.rows[0].parameters).rankingMetric,'mitCount');
tree=render({0:'bubbles'});assert.equal(tree.find(n=>n.type===C.AnimationBubbles).props.dimension,'marca');assert.equal(lastRequest.includeYoY,true);assert.equal(lastRequest.mode,'monthly');
render({0:'races',1:'suv',3:'SUV MID',6:'ytd'});assert.equal(lastRequest.porte[0],'SUV MID');assert.equal(lastRequest.mode,'ytd');
render({1:'midsize-pickups'});assert.equal(lastRequest.porte.length,0);assert.equal(lastRequest.preset,'midsize-pickups');
render({9:true});assert(!('marca'in lastRequest.filters));assert.deepEqual(lastRequest.filters.uf,['SP']);assert.equal(filters.marca[0],'MITSUBISHI','Comparison never mutates global filter state');
for(const kind of ['technology','body','porte','origin','channel','vehicleOrigin']){tree=render({0:'mix',11:kind});tree.find(n=>n.type==='button'&&n.props.children==='Exportar valores de todos os meses · CSV').props.onClick();assert.equal(exported.rows.filter(r=>r.month==='2026-09').reduce((s,r)=>s+r.count,0),268721);}
tree=render({0:'maps',12:'municipalVolume',14:'SP'});assert.equal(lastRequest.selectedUF,'SP');assert.equal(tree.find(n=>n.type===context.AnimationMaps).props.uf,'SP');
console.log('PASS workspace dataflow: all four mounted views, real-source CSV values/parameters/ranks/leadership, map UF, monthly/YTD rules, explicit brand scope, preset isolation and UF-to-bubble switching.');
