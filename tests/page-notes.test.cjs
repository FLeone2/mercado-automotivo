const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {pageNotePlan,PAGE_NOTE_CLASSES}=require('../src/page-notes.js');
const long='Esta explicação descreve em detalhes a interação com o painel e a organização das opções para facilitar a leitura das várias análises disponíveis ao longo desta página. Consulte as opções de visualização para explorar os resultados de outras maneiras.';
test('only reviewed explanation classes, never arbitrary paragraphs or statuses',()=>{
 assert.ok(pageNotePlan(long,{className:'am-footnote'}));
 for(const p of [{},{className:'am-scope-alert'},{className:'am-footnote',role:'status'},{className:'am-footnote','aria-live':'polite'}])assert.equal(pageNotePlan(long,p),null);
 assert.equal(pageNotePlan(['Warning',long],{className:'am-footnote'}),null);
 assert.equal(pageNotePlan('Unidade: registros.',{className:'am-footnote'}),null);
});
test('protect warnings, decimal coverage, units, denominator and source beside chart',()=>{
 for(const essential of ['EXPERIMENTAL: cobertura efetiva de 49.5%.','Sem denominador válido, valores indisponíveis.','Origem desconhecida permanece no total.','Fonte: base oficial de 2026.','Participação = volume ÷ denominador.','Não estima demanda ou vendas futuras.','Os filtros globais continuam aplicados.']){
  const text=essential+' '+long,plan=pageNotePlan(text,{className:'am-footnote'});
  assert.ok(plan);assert.ok(plan.summary.includes(essential),plan.summary);assert.equal(plan.text,text);
 }
});
test('React portal lifecycle rather than moving or accumulating DOM nodes',()=>{
 const s=fs.readFileSync('src/page-notes.js','utf8');
 assert.ok(s.includes('createPortal'));assert.ok(s.includes('React.useId()'));assert.ok(s.includes('aria-controls'));
 for(const forbidden of ['MutationObserver','appendChild(','removeChild(','innerHTML','registerNote','setInterval('])assert.ok(!s.includes(forbidden));
});
test('responsive selectors are scoped and preserve theme tokens and alerts',()=>{
 const css=fs.readFileSync('src/page-notes.css','utf8');
 assert.ok(css.includes('max-width:600px'));assert.ok(css.includes('minmax(0,1fr)'));assert.ok(css.includes('var(--surface)'));
 assert.ok(!/am-scope-alert[^}]*display\s*:\s*none/.test(css));assert.ok(!/svg\s*\{[^}]*min-width\s*:\s*\d{3}/.test(css));
});
test('native accessible disclosure, stable scoped footer and separate export footer',()=>{
 const s=fs.readFileSync('src/page-notes.js','utf8');
 assert.ok(s.includes("jsxRuntime.jsxs('details'"));assert.ok(s.includes("jsxRuntime.jsx('summary'"));
 assert.ok(s.includes(']},notesScope)'));assert.ok(s.includes("children:'Voltar à análise ↑'"));
 assert.ok(!s.includes('getMarketFooterContext'));assert.equal(PAGE_NOTE_CLASSES.has('am-scenario-provenance'),false);
});
test('mounted notes render accessible inline reference and complete portal content',()=>{
 let portals=[];const target={name:'footer'};
 const context={target,reveal:()=>{}};
 const jsx=(type,props,key)=>({type,props,key});
 const sandbox={module:{exports:{}},React:{createContext:()=>context,useContext:()=>context,useId:()=>':stable:'},jsxRuntime:{jsx,jsxs:jsx,Fragment:'fragment'},require:()=>({createPortal:(node,to,key)=>{portals.push({node,to,key});return {portal:true};}})};
 vm.runInNewContext(fs.readFileSync('src/page-notes.js','utf8')+'\nmodule.exports.PageNote=PageNote;',sandbox);
 const node=sandbox.module.exports.PageNote({className:'am-footnote',children:long});
 assert.equal(portals.length,1);assert.equal(portals[0].to,target);
 assert.equal(portals[0].node.props.children[0].props.children,long);
 const button=node.props.children[0].props.children[1];
 assert.equal(button.type,'button');assert.equal(button.props['aria-controls'],portals[0].node.props.id);
 assert.equal(portals[0].node.props.children[1].props.href,'#'+button.props.id);
});
test('unmounted/footer-less context retains complete original note without losing content',()=>{
 const jsx=(type,props)=>({type,props});
 const sandbox={module:{exports:{}},React:{createContext:()=>null,useContext:()=>null,useId:()=>':fallback:'},jsxRuntime:{jsx,jsxs:jsx},require:()=>{throw Error('Unexpected portal');}};
 vm.runInNewContext(fs.readFileSync('src/page-notes.js','utf8')+'\nmodule.exports.PageNote=PageNote;',sandbox);
 const result=sandbox.module.exports.PageNote({originalTag:'div',className:'am-footnote',children:long});
 assert.equal(result.type,'div');assert.equal(result.props.children,long);
});
test('municipal map notes keep coordinate/association caveats at point of use',()=>{
 const text='Bolhas em centroides das malhas municipais oficiais, com volume positivo, sem limite de quantidade na tabela. Correspondência única por nome normalizado + UF. Sem ponto fictício para nomes não associados. Os pontos não são endereços de compradores; centroides podem ficar fora de polígonos côncavos. A projeção é própria da UF e não permite comparar áreas geográficas entre estados.';
 const plan=pageNotePlan(text,{className:'anm-map-note'});assert.ok(plan);
 for(const warning of ['Sem ponto fictício','não são endereços','centroides podem','não permite comparar áreas'])assert.ok(plan.summary.includes(warning));
});
