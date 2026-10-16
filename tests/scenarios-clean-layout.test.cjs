const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('src/scenarios.js','utf8');
const {pageNotePlan}=require('../src/page-notes.js');
const jsx=(type,props,key)=>({type,props:props??{},key});
function fixture(context=null){
 let nextId=0;const portals=[];
 const React={createContext:()=>({Provider:'Provider'}),useContext:()=>context,useId:()=>String(++nextId),useState:value=>[value,()=>{}],useRef:value=>({current:value}),useMemo:fn=>fn()};
 const names=['ScenarioFooterBlock','ScenarioNotesLayout','ScenarioNote','ScenarioFold','ScenarioTable','ScenarioChart','ScenarioSourceCoverage','ScenarioFacts','ScenarioDiagnostic','ScenarioDiagnosticHistorical','ScenarioLoad','ScenarioWorkspace'];
 const api=new Function('React','jsxRuntime','require','dataApp','monthLabel','column','pageNotePlan',source+`;useScenarioFile=()=>({pending:true});return {${names.join(',')}};`)(React,{jsx,jsxs:jsx,Fragment:'Fragment'},()=>({createPortal:(node,target,key)=>{const portal={node,target,key};portals.push(portal);return portal;}}),{DataComponent:'DataComponent',DataTable:'DataTable',EvidenceChart:'EvidenceChart',useDataApp:()=>({sectionViews:{}})},String,(field,label)=>({field,label}),pageNotePlan);
 return {api,portals};
}
function all(node){if(Array.isArray(node))return node.flatMap(all);if(!node||typeof node!=='object')return[];return[node,...all(node.props?.children)];}
test('fallback is collapsed, complete and never flashes expanded source records',()=>{
 const {api,portals}=fixture();const payload={complete:'source receipt'};const node=api.ScenarioFooterBlock({title:'Fontes',children:payload});
 assert.equal(node.type,'details');assert.notEqual(node.props.open,true);assert.equal(node.props.children[1],payload);assert.equal(portals.length,0);
});
test('portal owns full content and accessible link; nested tables stay within their section',()=>{
 const target={},revealed=[];const {api,portals}=fixture({target,reveal:id=>revealed.push(id)});const payload=jsx('p',{children:'Full source and methodology'});
 const node=api.ScenarioFooterBlock({title:'Fonte',children:payload});const button=node.props.children[0];
 assert.equal(portals.length,1);assert.equal(portals[0].target,target);assert.equal(button.props['aria-controls'],portals[0].node.props.children.props.id);button.props.onClick();assert.deepEqual(revealed,[button.props['aria-controls']]);
 assert.equal(portals[0].node.props.value.inFooter,true);assert(all(portals[0].node).includes(payload));
 const nested=fixture({target,inFooter:true});assert.equal(nested.api.ScenarioFooterBlock({title:'Tabela',children:payload}).type,'section');assert.equal(nested.portals.length,0);
});
test('footer resets by subtab and has a native collapsed disclosure',()=>{
 const {api}=fixture();const tree=api.ScenarioNotesLayout({children:'charts',scope:'regional'});const footer=all(tree).find(n=>n.type==='footer'),details=all(footer).find(n=>n.type==='details');
 assert(footer);assert.notEqual(details.props.open,true);assert.equal(details.props.key,'regional');
 assert(source.includes('},tab);'));for(const forbidden of ['appendChild(','removeChild(','MutationObserver','innerHTML','registerNote'])assert(!source.includes(forbidden));
});
test('technical tables preserve rows, columns, search and component identity in footer',()=>{
 const {api}=fixture();const rows=[{value:42}],columns=[{field:'value'}];const tree=api.ScenarioTable({id:'audit-table',title:'Audit',rows,columns});
 assert.equal(tree.type,api.ScenarioFooterBlock);const table=tree.props.children;assert.equal(table.props.id,'audit-table');assert.equal(table.props.sourceRows,rows);assert.equal(table.props.displayRows,rows);assert.equal(table.props.children.props.columns,columns);assert.equal(table.props.children.props.searchable,true);
});
test('all visual fold sections stay expanded; only technical sections move to footer',()=>{
 const {api}=fixture();for(const title of ['Moran dos resíduos · diagnóstico espacial','Brasil e UFs · reconciliação hierárquica experimental','IPCA e PNAD · séries oficiais e frequência','Previsões anteriores · referência histórica']){const child=jsx('svg',{}),node=api.ScenarioFold({title,children:child});assert.equal(node.type,'section');assert(all(node).includes(child));}
 assert.equal(api.ScenarioFold({title:'Validação, pontos projetados e protocolo',children:'audit'}).type,api.ScenarioFooterBlock);
});
test('diagnostic leads with charts and retains the same source KPI facts',()=>{
 const {api}=fixture();const tree=api.ScenarioDiagnostic({base:'https://example.test/data/'});assert.equal(tree.props.children[0].type,api.ScenarioDiagnosticHistorical);
 const coverage=api.ScenarioSourceCoverage({data:{sources:[{key:'x',status:'partial'}],retrievedAt:'2026-10-15'},base:'https://example.test/data/'});const facts=coverage.props.children.find(n=>n?.type===api.ScenarioFacts);assert.equal(facts.props.facts.length,4);assert.equal(facts.props.facts[2][1],1);assert(coverage.props.children.some(n=>n?.props?.className==='am-scope-alert'));
});
test('long notes retain consequential warnings locally and every original word in footer',()=>{
 const {api}=fixture();const text='Sem denominador válido, valores indisponíveis. Esta explicação descreve em detalhes a interação com o painel e a organização das opções para facilitar a leitura das várias análises disponíveis ao longo desta página. Consulte as opções de visualização para explorar os resultados de outras maneiras.';
 const tree=api.ScenarioNote({className:'am-footnote',children:text});assert.equal(tree.props.children[0].props.children,'Sem denominador válido, valores indisponíveis.');assert.equal(tree.props.children[1].type,api.ScenarioFooterBlock);assert.equal(tree.props.children[1].props.children.props.children,text);
});
test('chart adapter retains every data/plot prop',()=>{
 const {api}=fixture();const rows=[{value:4}],spec={type:'line'};const node=api.ScenarioChart({id:'example',title:'Visual',rows,spec,description:'Unidade: registros',height:400});assert.equal(node.type,'EvidenceChart');assert.equal(node.props.rows,rows);assert.equal(node.props.sourceRows,rows);assert.equal(node.props.spec,spec);assert.equal(node.props.height,400);assert.equal(node.props.description,'Unidade: registros');
});
