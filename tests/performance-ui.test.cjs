const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/performance-ui.js','utf8');
let ref={current:null},effects=[];
const context={React:{useRef:()=>ref,useLayoutEffect:fn=>effects.push(fn)},jsxRuntime:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}};
vm.createContext(context);vm.runInContext(source+';this.boundary=PendingChartSnapshot;this.label=performanceFilterLabel;',context);
function render(props,commit=true){effects=[];let tree=context.boundary(props);if(commit)effects.forEach(fn=>fn());return tree;}
let old={type:'chart',props:{period:'2025',filters:{uf:'SP'},onExport:()=>{throw Error('must never fire while stale');}}};
const base={pending:false,error:null,ready:true,compatibilityKey:'dashboard',label:'Período: 2025 · UF: SP',children:old};
let tree=render(base);assert.equal(tree.props.children[1].props.children,old);
const next={...base,pending:true,ready:false,label:'Período: 2026 · UF: RJ',children:{type:'loading'}};
tree=render(next);assert.equal(tree.props['data-chart-stale'],'true');assert.equal(tree.props.children[1].props.children,old);assert.equal(tree.props.children[1].props.inert,true);assert.equal(tree.props.children[1].props.style.pointerEvents,'none');
const text=JSON.stringify(tree);assert(text.includes('Exibido (anterior): Período: 2025'));assert(text.includes('Solicitado (em cálculo): Período: 2026'));assert(text.includes('UF: SP'));assert(text.includes('UF: RJ'));
for(const name of ['onClickCapture','onKeyDownCapture','onPointerDownCapture','onSubmitCapture']){let prevented=false,stopped=false;tree.props.children[1].props[name]({preventDefault:()=>prevented=true,stopPropagation:()=>stopped=true});assert(prevented&&stopped,name);}
// Aborted ready render must not replace committed chart.
render({...base,children:{type:'aborted'}},false);assert.equal(render(next).props.children[1].props.children,old);
// Rapid updates preserve exactly the last completed chart, never intermediate filters.
assert.equal(render({...next,label:'2027'}).props.children[1].props.children,old);
assert.equal(render({...next,compatibilityKey:'history'}).props['data-chart-stale'],'false');
assert.equal(render(next).props['data-chart-stale'],'false');
render(base);tree=render({...next,pending:false,error:'Failed',children:{type:'error'}});assert.equal(tree.props['data-chart-stale'],'false');assert.equal(tree.props.children[1].props.children.type,'error');
assert.equal(render(next).props['data-chart-stale'],'false');
render(base);const fresh={type:'newchart'};tree=render({...base,children:fresh,label:'2026'});assert.equal(tree.props.children[1].props.children,fresh);assert.equal(tree.props.children[1].props.inert,undefined);
assert(context.label({date:'2026',uf:['SP','RJ'],marca:'all'}).includes('Período: 2026'));
const animations=fs.readFileSync('src/animations.js','utf8');assert(animations.includes("createSharedQueryWorker(()=>new Worker(url),'animations')"));assert(animations.includes('pinMIT]),query.pending)'));assert(animations.includes('if(!playing||paused||reduced||length<2)return;'));assert(animations.indexOf('h(PendingChartSnapshot')<animations.indexOf("className:'animations-player'"));assert(animations.includes("ready:frames.length>0"));
console.log('PASS retained charts: committed snapshot only, rapid updates, exact previous/requested labels, inert and portal event guards, schema switches, errors, fresh re-enable, animation pause.');
