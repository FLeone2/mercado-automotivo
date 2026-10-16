const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/evolution-views.js','utf8'),css=fs.readFileSync('src/evolution-views.css','utf8');
const jsx=(type,props)=>({type,props});
test('Evolution owns a scoped wrapper including its detailed charts',()=>{
 const context={React:{useState:v=>[v,()=>{}]},jsxRuntime:{jsx,jsxs:jsx,Fragment:'fragment'},dataApp:{Section:'section',SegmentedControl:'tabs'},MarketChart:'chart',MarketTable:'table',LegacyHistoryView:'legacy',mitsubishiColors:()=>({}),number:String,percent:String};
 vm.runInNewContext(source+';globalThis.render=HistoryView;',context);
 const market={monthly:[],brandsByMonth:[],groups:{marca:[]},bodyByMonth:[]};
 const node=context.render({model:{evolution:{market,mitsubishi:{total:0,bodyByMonth:[]}}},view:'executive'});
 assert.equal(node.type,'div');assert.equal(node.props.className,'ev-history-view');
 const legacy=node.props.children.at(-1);assert.equal(legacy.props.className,'ev-legacy');assert.equal(legacy.props.children[1].type,'legacy');
});
test('Evolution grids give each chart and following React note a whole row at every width',()=>{
 assert.match(css,/\.ev-history-view \.data-section\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/\.ev-history-view \.data-section>\*\{grid-column:1\/-1;min-width:0;max-width:100%\}/);
 assert.match(css,/\.ev-history-view \.data-section>\.am-footnote\{margin-block:0 8px;overflow-wrap:anywhere\}/);
 assert.doesNotMatch(source,/appendChild|removeChild|MutationObserver|innerHTML/);
});
test('notes retain their source text, denominator and missing-month caveats',()=>{
 const {pageNotePlan}=require('../src/page-notes.js');
 const description='Participação = registros de cada categoria ÷ todos os registros do mês no recorte global. Seleções locais não alteram esse denominador. Meses não processados permanecem lacunas.';
 const plan=pageNotePlan(description,{className:'am-footnote'});
 assert.equal(plan.text,description);assert.match(plan.summary,/todos os registros do mês/);assert.match(plan.summary,/não alteram esse denominador/);
 const s=fs.readFileSync('src/page-notes.js','utf8');
 assert.match(s,/createPortal/);assert.match(s,/children:plan.text/);
});
