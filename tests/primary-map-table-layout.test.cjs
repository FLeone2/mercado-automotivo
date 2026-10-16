// Exercise the shipped DataTable renderer, not a hand-written lookalike.
// Source/CSS contract regression only; this is not browser layout QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'src/primary-map.css'),'utf8');
const searchAt=html.indexOf('"aria-label":`Search data`'),start=html.lastIndexOf('function ',searchAt),end=html.indexOf('function ',start+9);
assert(start>=0&&end>start,'Locate the actual shipped DataTable');
const name=html.slice(start).match(/^function (\w+)\(/)[1];
let slots=[],cursor=0,selected;
const jsx=(type,props)=>({type,props:props??{}}),context={C:{useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=v];},useMemo:f=>f(),useRef:()=>({current:null}),useEffect:()=>{}},w:{jsx,jsxs:jsx,Fragment:'fragment'},kV:'icon',oY:()=>false,_L:String,sY:()=>false,iY:()=>undefined,LOe:(a,b,descending)=>String(a).localeCompare(String(b))*(descending?-1:1)};
vm.createContext(context);vm.runInContext(html.slice(start,end)+`;this.renderTable=${name}`,context);
const rows=[{name:'ABAIRA · BA',count:8},{name:'ÉRICO CARDOSO · BA',count:5}];
const render=()=>{cursor=0;return context.renderTable({rows,columns:[{field:'name',label:'Município · UF'},{field:'count',label:'Volume'}],onRowSelect:row=>selected=row,rowActionLabel:row=>'Explorar '+row.name});};
function nodes(n,result=[]){if(!n||typeof n!=='object')return result;result.push(n);for(const child of [n.props.children].flat(Infinity))nodes(child,result);return result;}
let all=nodes(render()),search=all.find(n=>n.type==='input'&&n.props.className==='search'),label=all.find(n=>n.type==='label');
assert.equal(label.props.className,'search-field');assert(label.props.children.includes(search));assert.equal(search.props['aria-label'],'Search data');
const actions=all.filter(n=>n.props.className==='table-row-action');assert.equal(actions.length,2);assert(actions.every(n=>n.type==='button'&&n.props.type==='button'&&n.props['aria-label']));
actions[1].props.onClick();assert.equal(selected,rows[1],'Native button activation still selects the row');
search.props.onChange({target:{value:'ABAIRA'}});all=nodes(render());assert.equal(all.filter(n=>n.props.className==='table-row-action').length,1,'Runtime search still filters');
// Keep map-only styles out of runtime search, sort, menu, and paging controls.
assert(!/\.pm-primary\s+(?:button|label|input|select)(?:\s*[,\{]|:disabled)/.test(css),'No unscoped map control skin');
assert.match(css,/\.pm-primary \.pm-controls label,\.pm-primary label\.pm-table-search\{/);
assert.match(css,/\.pm-primary :is\(\.pm-controls,\.pm-table-search\) input/);
const rule=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=css.match(new RegExp(escaped+'\\{([^}]+)\\}'));assert(match,'Missing runtime selector '+selector);return match[1];};
assert.match(rule('.pm-primary .table-toolbar .search-field'),/min-width:0/);
assert.match(rule('.pm-primary .table-toolbar input.search'),/min-width:0/);
assert.match(rule('.pm-primary .table-row-action-cell'),/justify-content:space-between/);
assert.match(rule('.pm-primary .table-row-action'),/flex:0 0 32px/);
assert.match(rule('.pm-primary .table-row-action span'),/opacity:1/);
assert.match(css,/@media\(pointer:coarse\).*min-height:44px/);
assert.match(css,/:is\(button,input,select\):focus-visible\{outline:2px/,'Keyboard focus remains visible');
console.log('Primary map: real runtime search/row-action contracts and scoped CSS passed');
