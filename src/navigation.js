// Registered leaf IDs are stable contracts for old links, favorites and history.
const marketTabs=[{id:'dashboard',label:'Panorama',previousLabels:['Visão geral']},{id:'history',label:'Evolução'},{id:'competition',label:'Marcas e modelos'},{id:'ranking',label:'Ranking'},{id:'segments',label:'Estrutura BD'},{id:'structure',label:'Pirâmide BD'},{id:'technology',label:'Propulsão'},{id:'origin',label:'Origem'},{id:'geography',label:'Territórios',previousLabels:['Mapa do mercado']},{id:'explore',label:'Explorar'},{id:'models',label:'Cenários',previousLabels:['Modelos e cenários']},{id:'quality',label:'Dados e metodologia',previousLabels:['Dados e atualização']}];
const marketNavigation=[
 {id:'dashboard',label:'Panorama',routes:['dashboard']},
 {id:'history',label:'Evolução',routes:['history']},
 {id:'competition',label:'Concorrência',routes:['competition','ranking']},
 {id:'segments',label:'Segmentos',routes:['segments','structure','technology','origin']},
 {id:'geography',label:'Territórios',routes:['geography']},
 {id:'explore',label:'Explorar',routes:['explore']},
 {id:'models',label:'Cenários',routes:['models']}
];
function navigationLocation(tab,explorationView){
 const leaf=tab==='explore'&&explorationView==='structure'?'structure':tab;
 return {leaf,group:marketNavigation.find(group=>group.routes.includes(leaf))??null,label:marketTabs.find(item=>item.id===leaf)?.label??'Panorama'};
}
function MarketNavigation({tab,explorationView,onNavigate}){
 const location=navigationLocation(tab,explorationView);
 const link=(id,label,active)=>jsxRuntime.jsx('button',{type:'button',className:'am-nav-link','aria-current':active?'page':undefined,onClick:()=>onNavigate(id),children:label},id);
 return jsxRuntime.jsxs('div',{className:'am-navigation',children:[
  jsxRuntime.jsxs('div',{className:'am-navigation-row',children:[jsxRuntime.jsx('nav',{'aria-label':'Áreas do mercado',className:'am-primary-nav',children:marketNavigation.map(group=>link(group.id,group.label,location.group?.id===group.id))}),jsxRuntime.jsx('nav',{'aria-label':'Documentação',className:'am-secondary-nav',children:link('quality','Dados e metodologia',tab==='quality')})]}),
  location.group?.routes.length>1&&jsxRuntime.jsx('nav',{'aria-label':'Análises de '+location.group.label,className:'am-leaf-nav',children:location.group.routes.map(id=>link(id,marketTabs.find(item=>item.id===id).label,location.leaf===id))}),
  jsxRuntime.jsx('div',{className:'am-breadcrumb','aria-label':'Localização atual',children:[location.group?.label,location.group?.routes.length>1?location.label:null].filter(Boolean).join(' / ')||location.label})
 ]});
}

function MarketIdentity(){
 return jsxRuntime.jsxs('div',{className:'am-market-identity',children:[
  jsxRuntime.jsxs('svg',{className:'am-market-logo',viewBox:'0 0 64 64','aria-hidden':true,focusable:false,children:[
   jsxRuntime.jsx('rect',{x:1,y:1,width:62,height:62,rx:19,fill:'var(--surface)',stroke:'var(--border-strong)'}),
   jsxRuntime.jsx('path',{d:'M12 42 20 24h24l8 18M16 34h32M20 24l5-6h14l5 6',fill:'none',stroke:'var(--accent)',strokeWidth:3,strokeLinecap:'round',strokeLinejoin:'round'}),
   jsxRuntime.jsx('path',{d:'M18 45h28M25 39v-6m7 6V27m7 12v-9',fill:'none',stroke:'var(--accent)',strokeWidth:3,strokeLinecap:'round'}),
   jsxRuntime.jsx('circle',{cx:19,cy:46,r:4,fill:'var(--accent)'}),jsxRuntime.jsx('circle',{cx:45,cy:46,r:4,fill:'var(--accent)'})
  ]}),
  jsxRuntime.jsxs('div',{children:[jsxRuntime.jsx('span',{className:'am-market-eyebrow',children:'Inteligência de mercado'}),jsxRuntime.jsx('h1',{children:'Mercado Automotivo'})]})
 ]});
}
// Move the authored header into the existing shell topbar; keep a usable inline
// fallback while mounting and when the host is absent. React owns all controls.
function MarketHeader(props){
 const [host,setHost]=React.useState(null);
 React.useEffect(()=>{
  const target=document.querySelector('.dashboard-topbar-copy');
  if(!target)return;
  const node=document.createElement('div');node.className='am-header-host';target.appendChild(node);setHost(node);
  return ()=>{node.remove();};
 },[]);
 const content=jsxRuntime.jsxs('header',{className:'am-masthead',children:[jsxRuntime.jsx(MarketIdentity,{}),jsxRuntime.jsx(MarketNavigation,props)]});
 return host?require('react-dom').createPortal(content,host):content;
}
