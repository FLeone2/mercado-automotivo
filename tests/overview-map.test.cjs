const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const authored=html.slice(html.indexOf('(function(module,exports,require){')+'(function(module,exports,require){'.length,html.indexOf('})(__dataAuthoredModule,__dataAuthoredModule.exports,__dataAuthoredRequire)'));
let slots=[],cursor=0;const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];}};
const jsx=(type,props,key)=>({type,props:props??{},key});
const api=new Function('require','exports',authored+';return {BrazilMap,StateMap};')(name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:new Proxy({},{get:(_,key)=>key}),{});
function all(node){if(node==null||typeof node!=='object')return[];return[node,...[node.props?.children].flat(Infinity).flatMap(all)];}
let selectedUF=null,changes=[],drills=[];const rows=[{name:'BA',count:120,marketShare:.2},{name:'SP',count:480,marketShare:.8}];
function render(){cursor=0;return api.BrazilMap({rows,scope:[],selectedUF,selectedUFs:selectedUF?[selectedUF]:[],onSelectionChange:uf=>{selectedUF=uf;changes.push(uf);},onSelect:uf=>drills.push(uf)});}
function path(tree,uf){return all(tree).find(n=>n.type==='path'&&n.props['data-uf']===uf);}
function text(tree){return all(tree).flatMap(n=>[n.props.children].flat(Infinity).filter(x=>typeof x==='string')).join(' ');}
let tree=render();path(tree,'BA').props.onClick();tree=render();assert.equal(selectedUF,'BA');assert.equal(path(tree,'BA').props['aria-pressed'],true);
path(tree,'SP').props.onMouseEnter();tree=render();assert.equal(selectedUF,'BA');assert.equal(changes.length,1);assert(text(tree).includes('Selecionado: BA'));assert(text(tree).includes('SP · consulta rápida'));assert.equal(path(tree,'SP').props['aria-pressed'],false);
path(tree,'SP').props.onMouseLeave();tree=render();assert(!all(tree).some(n=>n.props.role==='tooltip'));assert.equal(selectedUF,'BA');
path(tree,'SP').props.onFocus();tree=render();assert.equal(selectedUF,'BA','Focus alone must not select');path(tree,'SP').props.onBlur();tree=render();assert(!all(tree).some(n=>n.props.role==='tooltip'));
path(tree,'SP').props.onClick();tree=render();assert.equal(selectedUF,'SP');assert.equal(path(tree,'BA').props['aria-pressed'],false);
let prevented=false;path(tree,'BA').props.onKeyDown({key:' ',preventDefault(){prevented=true;}});tree=render();assert(prevented);assert.equal(selectedUF,'BA');
all(tree).find(n=>n.type==='button'&&n.props.children==='Explorar municípios e concessionárias ↗').props.onClick();assert.deepEqual(drills,['BA']);
all(tree).find(n=>n.type==='button'&&n.props.children==='Limpar seleção').props.onClick();tree=render();assert.equal(selectedUF,null);assert(!all(tree).some(n=>n.type==='path'&&n.props['aria-pressed']));assert(!all(tree).some(n=>n.props.role==='tooltip'));
path(tree,'SP').props.onKeyDown({key:'Enter',preventDefault(){}});tree=render();assert.equal(selectedUF,'SP');path(tree,'BA').props.onMouseEnter();tree=render();all(tree).find(n=>n.props.className==='am-overview-map-stage').props.onMouseLeave();tree=render();assert(!all(tree).some(n=>n.props.role==='tooltip'));
slots=[];cursor=0;const geoProps={rows,scope:[],metric:'count',channel:'all',channelVolumeAvailable:true,onSelect:uf=>drills.push(uf)};const geo=()=>{cursor=0;return api.StateMap(geoProps);};tree=geo();const geoPath=(tree,uf)=>all(tree).find(n=>n.type==='path'&&n.props['aria-label'].startsWith(uf+':'));
geoPath(tree,'BA').props.onClick();tree=geo();geoPath(tree,'SP').props.onMouseEnter();tree=geo();assert.equal(geoPath(tree,'BA').props['aria-pressed'],true);assert.equal(geoPath(tree,'SP').props['aria-pressed'],false);assert(all(tree).some(n=>n.props.className==='am-state-name'&&n.props.children==='BA'));
assert(html.includes('.am-brazil-map .am-state:focus,.am-brazil-map .am-state:focus-visible{outline:none!important;box-shadow:none!important}'));
assert(html.includes('stroke-dasharray:5 2'));assert(!html.includes("tab!=='dashboard'&&jsxRuntime.jsxs('div', { className: \"am-context-actions\""));
assert(html.includes("tab!=='ranking'&&jsxRuntime.jsxs('footer'"));
console.log('PASS: persistent BA selection while hovering/focusing SP, click switching, Enter/Space, explicit clear, mouse-leave cleanup, municipality drill, geography parity, SVG focus and footer actions.');
