const publishedSource=require('node:child_process').execFileSync('python',['scripts/build-page-notes.py','--source-only','src/evolution-views.js'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'});
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/evolution-views.js'),'utf8'),css=fs.readFileSync(path.join(root,'src/evolution-views.css'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let states=[true,'count','stackedArea','',null],cursor=0;
const jsx=(type,props)=>({type,props}),React={useState(initial){const i=cursor++;return [states[i]??initial,v=>{states[i]=typeof v==='function'?v(states[i]):v;}];}};
const context=vm.createContext({React,jsxRuntime:{jsx,jsxs:jsx,Fragment:'fragment'},dataApp:{Section:'section',SegmentedControl:'tabs',Dropdown:'dropdown'},MarketChart:'chart',MarketTable:'table',LegacyHistoryView:'legacy',number:String,percent:String,mitsubishiColors:()=>({}),TECHNOLOGY_COLORS:{}});
vm.runInContext(source+';globalThis.render=HistoryView',context);
const market={total:10,monthly:[{date:'2026-09-01',count:10}],groups:{marca:[{name:'TOYOTA',count:10}]},brandsByMonth:[],propulsionByMonth:[{date:'2026-09-01',name:'Flex',count:10}],bodyByMonth:[]},model={evolution:{market,mitsubishi:{...market}}};
const walk=n=>n&&typeof n==='object'?[n,...[n.props?.children].flat(Infinity).flatMap(walk)]:[];
function render(){cursor=0;return walk(context.render({model,scope:[],view:'composition'}));}
for(const mode of ['stackedArea','stackedBar','volume','stackedArea']){
 const control=render().find(n=>n.props?.className==='ev-composition-mode');
 assert.equal(control.type,'tabs');assert.equal(control.props.ariaLabel,'Visualização da composição por propulsão');assert(!control.props.fullWidth);
 assert.deepEqual(Array.from(control.props.options,o=>o.value),['stackedArea','stackedBar','volume']);
 control.props.onChange(mode);
 const nodes=render();assert.equal(nodes.find(n=>n.props?.className==='ev-composition-mode').props.value,mode);
 for(const id of ['evolution-mix-market','evolution-mix-mit']){
  const chart=nodes.find(n=>n.props?.id===id);assert.equal(chart.props.spec.type,mode==='volume'?'stackedBar':mode);assert.equal(chart.props.spec.y,mode==='volume'?'count':'marketShare');assert.equal(chart.props.rows[0].count,10);assert.equal(chart.props.rows[0].marketShare,1);
 }
}
assert(css.includes('.ev-composition-mode.data-segmented-control{justify-self:start;width:fit-content;max-width:100%;box-sizing:border-box;overflow-x:auto}'));
assert(css.includes('.ev-composition-mode.data-segmented-control button{flex:0 0 auto}'));
assert(html.includes(publishedSource));assert(html.includes(css));
console.log('PASS: composition selector compact/overflow styles, accessible label, repeated three-mode switching, chart mappings and unmodified values.');
