const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const nav=fs.readFileSync('src/navigation.js','utf8'),scenario=fs.readFileSync('src/scenarios.js','utf8'),history=fs.readFileSync('src/evolution-views.js','utf8'),ranking=fs.readFileSync('src/ranking-views.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('src/navigation.css','utf8');
const jsx=(type,props)=>({type,props});const tabs=new Function(scenario.slice(0,scenario.indexOf('const scenarioNumber'))+';return SCENARIO_TABS')();
const api=new Function('jsxRuntime','SCENARIO_TABS',nav+';return {MarketSubnavigation,MarketNavigation,marketTabs,EVOLUTION_TABS};')({jsx,jsxs:jsx},tabs);
const walk=n=>n&&typeof n==='object'?[n,...[n.props?.children].flat(Infinity).flatMap(walk)]:[];
for(const [tab,options,prop,callback] of [['history',api.EVOLUTION_TABS,'evolutionView','onEvolutionView'],['models',tabs,'scenarioView','onScenarioView']]){
 let current=options[0].value;const render=()=>walk(api.MarketSubnavigation({tab,[prop]:current,[callback]:value=>current=value,onNavigate:()=>{}}));
 for(const item of [...options,...options].reverse()){
  const buttons=render().find(n=>n.props?.className==='am-leaf-nav').props.children;
  assert.deepEqual(buttons.map(n=>n.props.children),options.map(n=>n.label));
  buttons.find(n=>n.props.children===item.label).props.onClick();
  assert.equal(render().filter(n=>n.props?.['aria-current']==='page')[0].props.children,item.label);
 }
}
for(const tab of api.marketTabs){const primary=walk(api.MarketNavigation({tab:tab.id,onNavigate:()=>{}}));assert.equal(primary.filter(n=>n.type==='button').length,8);const second=walk(api.MarketSubnavigation({tab:tab.id,onNavigate:()=>{}}));assert(second.some(n=>n.props?.className==='am-leaf-nav'));assert(!primary.some(n=>n.props?.className==='am-leaf-nav'));}
const dashboard=html.slice(html.indexOf('function DashboardContent'),html.indexOf('function Composition({'));
assert(dashboard.indexOf('jsxRuntime.jsx(MarketSubnavigation,navigationProps)')<dashboard.indexOf('jsxRuntime.jsx(MarketFilterBar,'));
assert(!dashboard.includes('jsxRuntime.jsx(RankingSubtabs,'));
assert(ranking.indexOf('jsxRuntime.jsx(RankingSubtabs,{value:view')<ranking.indexOf("className:'am-ranking-compact-heading'"));
assert(!history.includes('value:view,onChange:setView'));assert(!scenario.includes("className:'am-scenario-tabs'"));
assert(!nav.includes('am-breadcrumb'));assert(!html.includes('market-filter-quick'));assert(!html.includes('Acesso rápido por grupo modelo'));
assert(css.includes('grid-template-columns:max-content minmax(0,1fr)'));assert(!css.includes('minmax(0,3fr)'));
assert(css.includes('.am-app .market-filter-primary>.filters{flex:1 1 auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr))'));
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));assert(css.includes('height:auto;min-height:112px;align-self:start;grid-template-rows:auto auto'));
assert.equal(cp.execFileSync('git',['diff','5e54cc6','--','data',':(exclude)data/scenarios/manifest.json']).toString(),'');
console.log('PASS: consistent primary/subnav hierarchy across all routes, repeated Evolution/Cenários switching, Ranking-local formats, additional-filter placement, compact responsive layout contracts and unchanged datasets (catalog worker extension covered separately).');
