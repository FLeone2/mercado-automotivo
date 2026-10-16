// National readout source/handler regression; browser layout is verified separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),population=JSON.parse(read('data/geography/catalog-population.json'));
const nationalGeometry=JSON.parse(JSON.parse(html.match(/const value\$3 = JSON.parse\(("(?:[^"\\]|\\.)*")\)/)[1]));
const stateGeometry=new Map(nationalGeometry.features.map(f=>[f.uf,JSON.parse(read('data/geography/'+f.uf+'.json'))]));
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

props.filters={uf:[],tipo_venda:'all'};
function render(){cursor=0;return api.PrimaryMap(props);}
const byClass=(tree,cls)=>nodes(tree).find(n=>n.props.className===cls);
const ufPath=(tree,uf)=>nodes(tree).find(n=>n.props['data-uf']===uf);
let tree=render(),readout=byClass(tree,'pm-national-readout');
assert(readout);
assert.equal(readout.props['aria-live'],'polite');
assert.equal(readout.props['aria-atomic'],true);
assert(!byClass(tree,'pm-hover'),'Small municipal readout is not shown nationally');
assert(!nodes(tree).some(n=>n.type==='h2'),'Redundant national title is removed');
assert.equal(tree.props['aria-label'],'Mapa principal de emplacamentos');
assert(nodes(tree).some(n=>n.type==='svg'&&n.props['aria-label']==='Brasil; selecione uma UF para explorar'));
const area=byClass(tree,'pm-map-area');
assert.equal(area.props.children[0].type,'svg');
assert.equal(area.props.children[1],readout,'Readout is directly below Brazil inside its map column');
assert(text(readout).includes('use Tab'));

ufPath(tree,'SP').props.onMouseEnter();tree=render();
assert.equal(text(byClass(tree,'pm-national-place')),'São Paulo · SP');
assert.equal(text(byClass(tree,'pm-national-value')),'30');
assert.equal(text(byClass(tree,'pm-national-metric')),'Volume');
assert.equal(changes.length,0,'Hover is read-only');
ufPath(tree,'SP').props.onMouseLeave();tree=render();
assert(byClass(tree,'pm-national-hint'));
ufPath(tree,'SP').props.onFocus();tree=render();
assert.equal(text(byClass(tree,'pm-national-value')),'30');
assert.equal(changes.length,0,'Keyboard focus is read-only');

const labels={count:'Volume',share:'Participação da seleção',per1000:'Por 1.000 residentes · 2026',channelShare:'Participação do canal'};
for(const metric of Object.keys(labels)){
 view.metric=metric;tree=render();
 ufPath(tree,'SP').props.onFocus();tree=render();
 const row=nodes(tree).find(n=>n.type==='market-table').props.rows.find(r=>r.name==='SP');
 const expected=vm.runInContext('primaryMapValue',context)(row[metric],metric);
 assert.equal(text(byClass(tree,'pm-national-value')),expected,metric+' uses actual selected metric');
 assert.equal(text(byClass(tree,'pm-national-metric')),labels[metric]);
}
view.metric='count';tree=render();
ufPath(tree,'AC').props.onFocus();tree=render();
assert.equal(text(byClass(tree,'pm-national-value')),'0','Real zero is retained');
props.model={...model,total:null,complete:false};tree=render();
ufPath(tree,'AC').props.onFocus();tree=render();
assert.equal(text(byClass(tree,'pm-national-value')),'—','Unavailable volume is not converted into zero');
props.model=model;tree=render();
ufPath(tree,'SP').props.onBlur();tree=render();assert(byClass(tree,'pm-national-hint'));
ufPath(tree,'SP').props.onKeyDown({key:'Enter',preventDefault(){}});
assert.deepEqual(changes.at(-1),['uf','SP'],'UF keyboard navigation unchanged');

props.filters={uf:['SP'],tipo_venda:'all'};tree=render();
assert(!byClass(tree,'pm-national-readout'),'Large readout is national only');
assert(nodes(tree).some(n=>n.type==='h2'&&n.props.children==='Municípios de SP'));
assert.equal(text(byClass(tree,'pm-hover')),'Toque ou pressione Enter em um município para fixar os detalhes.');
const city=byClass(tree,'pm-city');city.props.onFocus();tree=render();
assert(text(byClass(tree,'pm-hover')).includes('consulta rápida'),'Original municipal readout remains');
const css=read('src/primary-map.css');
const block=css.match(/\.pm-primary \.pm-national-readout\{([^}]+)\}/)[1];
assert(block.includes('height:144px'));
assert(block.includes('box-sizing:border-box'));
assert(block.includes('align-items:center')&&block.includes('text-align:center'));
assert(css.includes('font-size:clamp(32px,4vw,44px)'));
console.log('PASS national large centered readout: hover/focus, selected metric, zero/unavailable, reserved space, accessible labels, unchanged municipal readout and UF navigation.');
