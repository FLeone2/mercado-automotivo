// Monthly/YTD playback maps. Data is never interpolated or carried forward.
// Depends on catalog-maps.js, the bundled IBGE value$3 and MarketTable.
const ANIMATION_MAP_TECHNOLOGIES = Object.freeze(['BEV','PHEV','HEV','MHEV']);
const ANIMATION_MAP_TECHNOLOGY_LABELS = Object.freeze({BEV:'BEV · elétricos a bateria',PHEV:'PHEV · híbridos plug-in',HEV:'HEV · híbridos',MHEV:'MHEV · híbridos leves',ALL_ELECTRIFIED:'Eletrificados · BEV + PHEV + HEV + MHEV'});
const animationMapNumber = value => Number.isFinite(value) ? value.toLocaleString('pt-BR',{maximumFractionDigits:0}) : '—';
const animationMapPercent = value => Number.isFinite(value) ? (value*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%' : '—';
const animationMapNonnegative = value => Number.isFinite(value)&&value>=0 ? value : null;
function animationMapTechnology(value){
 const key=String(value??'ALL_ELECTRIFIED').trim().toUpperCase().replace(/[ -]/g,'_');
 return ['ALL','ELECTRIFIED','ALL_ELECTRIC','ALLELECTRIC','ALL_ELECTRIFIED','TODOS','ELETRIFICADOS'].includes(key)?'ALL_ELECTRIFIED':ANIMATION_MAP_TECHNOLOGIES.includes(key)?key:null;
}
function animationMapMetric(value){
 const key=String(value??'mitShare');
 return ['municipalVolume','municipality','municipal','municipal-volume','concentration','volume','count'].includes(key)?'municipalVolume':['electrification','electrifiedShare','electric','technology','technologyShare'].includes(key)?'electrification':'mitShare';
}
function animationMapFrameList(input){return Array.isArray(input)?input:Array.isArray(input?.frames)?input.frames:[];}
function animationMapCurrentFrame(input,selection){
 const frames=animationMapFrameList(input);
 if(selection&&typeof selection==='object')return selection;
 if(typeof selection==='string')return frames.find(f=>f.month===selection||f.date===selection)||null;
 const index=selection==null?0:Number(selection);
 return Number.isInteger(index)&&index>=0&&index<frames.length?frames[index]:null;
}
function animationMapTechnologyCount(row,technology){
 if(!technology||!row?.technologyCounts||typeof row.technologyCounts!=='object')return null;
 const keys=technology==='ALL_ELECTRIFIED'?ANIMATION_MAP_TECHNOLOGIES:[technology];
 const values=keys.map(key=>Object.hasOwn(row.technologyCounts,key)?animationMapNonnegative(row.technologyCounts[key]):0);
 return values.every(value=>value!==null)?values.reduce((sum,value)=>sum+value,0):null;
}
function animationMapStandardRow(raw,frame,technology){
 const complete=frame?.complete===true&&raw?.complete!==false&&raw?.coverageComplete!==false;
 const rawCount=Object.hasOwn(raw,'count')?raw.count:Object.hasOwn(raw,'total')?raw.total:raw.marketCount;
 const count=complete?animationMapNonnegative(rawCount):null;
 const marketCount=complete?animationMapNonnegative(Object.hasOwn(raw,'marketCount')?raw.marketCount:rawCount):null;
 const mitCount=complete?animationMapNonnegative(raw.mitCount):null;
 const technologyCount=complete&&frame?.technologyAvailable!==false?animationMapTechnologyCount(raw,technology):null;
 const unclassifiedCount=complete?animationMapNonnegative(Object.hasOwn(raw,'unclassifiedCount')?raw.unclassifiedCount:raw.technologyCounts?.['Não classificado']??(raw.technologyCounts?0:null)):null;
 return {...raw,count,marketCount,mitCount,technologyCount,unclassifiedCount,
  mitShare:marketCount>0&&mitCount!==null?mitCount/marketCount:null,
  technologyShare:marketCount>0&&technologyCount!==null?technologyCount/marketCount:null,
  observedCount:animationMapNonnegative(raw.observedCount??(complete?rawCount:null)),
  period:String(frame?.month??frame?.date??'—'),mode:frame?.mode==='ytd'?'Acumulado no ano':'Mensal',
  coverage:complete?(count===null?'Valor indisponível':'Cobertura completa'):'Cobertura incompleta ou desconhecida',
  coverageStatus:String(raw.coverageStatus??frame?.coverageStatus??(complete?'complete':'unknown'))};
}
function animationMapEmptyRow(name,uf,available){
 return {name,uf,count:available?0:null,marketCount:available?0:null,mitCount:available?0:null,technologyCounts:available?{}:null,unclassifiedCount:available?0:null,observedCount:available?0:null};
}
function animationMapStateRows(frame,technology,features=value$3.features){
 const source=Array.isArray(frame?.ufRows)?frame.ufRows:[],index=new Map(source.map(row=>[String(row.uf??row.name).toUpperCase(),row]));
 const known=new Set(features.map(feature=>feature.uf));
 return [...features.map(feature=>animationMapStandardRow({...animationMapEmptyRow(feature.uf,feature.uf,frame?.complete===true&&Array.isArray(frame?.ufRows)),...index.get(feature.uf),name:feature.uf,uf:feature.uf,path:feature.path,geographicMatch:'Malha oficial da UF'},frame,technology)),
  ...source.filter(row=>!known.has(String(row.uf??row.name).toUpperCase())).map(row=>animationMapStandardRow({...row,name:String(row.name??row.uf??'UF não informada'),path:null,geographicMatch:'UF sem correspondência na malha'},frame,technology))];
}
function animationMapMunicipalSource(frame,uf){
 const rows=Array.isArray(frame?.municipalityRows)?frame.municipalityRows:[];
 const selected=String(frame?.selectedUF??'').toUpperCase();
 const ready=Boolean(uf)&&Array.isArray(frame?.municipalityRows)&&(selected===uf||(!selected&&rows.some(row=>row.uf===uf||String(row.name).endsWith(' · '+uf))));
 const scoped=rows.filter(row=>row.uf===uf||String(row.name).endsWith(' · '+uf)).map(row=>{
  const municipality=String(row.municipality??String(row.name??'').replace(new RegExp(' · '+uf+'$'),''));
  return {...row,uf,municipality,name:municipality+' · '+uf};
 });
 return {ready,rows:ready?scoped:[],frame:ready?frame:{...frame,complete:false,coverageStatus:'municipal-unavailable'}};
}
function animationMapMergeMunicipalRows(rows){
 const first=rows[0];if(rows.length===1)return first;
 const sum=field=>rows.every(row=>animationMapNonnegative(row[field])!==null)?rows.reduce((total,row)=>total+row[field],0):null;
 const technologyKeys=[...new Set(rows.flatMap(row=>Object.keys(row.technologyCounts??{})))];
 return {...first,count:sum('count'),marketCount:sum('marketCount'),mitCount:sum('mitCount'),observedCount:sum('observedCount'),unclassifiedCount:sum('unclassifiedCount'),
  technologyCounts:rows.every(row=>row.technologyCounts)?Object.fromEntries(technologyKeys.map(key=>[key,rows.every(row=>!Object.hasOwn(row.technologyCounts,key)||animationMapNonnegative(row.technologyCounts[key])!==null)?rows.reduce((total,row)=>total+(row.technologyCounts[key]??0),0):null])):null};
}
function animationMapMunicipalRows(frame,uf,geometry,technology='ALL_ELECTRIFIED'){
 const source=animationMapMunicipalSource(frame,uf),complete=source.ready&&source.frame?.complete===true;
 if(!geometry||geometry.uf!==uf)return {ready:source.ready,rows:source.rows.map(row=>animationMapStandardRow({...row,ibgeCode:row.ibgeCode??null,path:null,x:null,y:null,geographicMatch:'Malha municipal indisponível; valor preservado'},source.frame,technology)),matches:[],unmatched:source.rows};
 const joined=catalogMunicipalJoin(source.rows,geometry),grouped=new Map();
 for(const row of joined.matches){const key=String(row.ibgeCode);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
 const matched=geometry.features.map(feature=>{
  const found=grouped.get(String(feature.code)),point=catalogPathCentroid(feature.path);
  const raw=found?animationMapMergeMunicipalRows(found):{...animationMapEmptyRow(feature.name+' · '+uf,uf,complete),municipality:feature.name};
  return animationMapStandardRow({...raw,name:feature.name+' · '+uf,municipality:feature.name,uf,ibgeCode:feature.code,path:feature.path,x:point?.[0]??null,y:point?.[1]??null,geographicMatch:found?'Nome normalizado + UF únicos':complete?'Sem registros no recorte':'Cobertura indisponível'},source.frame,technology);
 });
 const unmatched=joined.unmatched.map(row=>animationMapStandardRow({...row,ibgeCode:null,path:null,x:null,y:null},source.frame,technology));
 return {ready:source.ready,rows:[...matched,...unmatched],matches:matched.filter(row=>Number.isFinite(row.x)&&Number.isFinite(row.y)),unmatched};
}
function animationMapDomains(frames,metric,technology,uf){
 let maximum=0;
 for(const frame of animationMapFrameList(frames)){
  if(metric==='municipalVolume'){
   const source=animationMapMunicipalSource(frame,uf);
   if(source.ready&&source.frame?.complete===true){
    const grouped=new Map();for(const row of source.rows){const key=catalogMapNormalize(row.name);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
    for(const rows of grouped.values())maximum=Math.max(maximum,animationMapNonnegative(animationMapMergeMunicipalRows(rows).count)??0);
   }
  }else for(const row of animationMapStateRows(frame,technology))maximum=Math.max(maximum,row[metric==='electrification'?'technologyShare':'mitShare']??0);
 }
 return {min:0,max:maximum>0?maximum:1,observedMax:maximum};
}
function animationMapColor(value,maximum){
 if(!Number.isFinite(value))return null;
 const t=Math.max(0,Math.min(1,value/(maximum||1)));
 return `rgb(${Math.round(233-212*t)},${Math.round(243-151*t)},${Math.round(255-83*t)})`;
}
function animationMapViewBox(viewBox,padding=32){
 const values=String(viewBox??'').split(/\s+/).map(Number);
 if(values.length!==4||!values.every(Number.isFinite)||values[2]<=0||values[3]<=0)return '0 0 640 600';
 return [values[0]-padding,values[1]-padding,values[2]+padding*2,values[3]+padding*2].join(' ');
}
function animationMapTooltip(row,metric,technology){
 const measure=metric==='municipalVolume'?'Volume: '+animationMapNumber(row.count):metric==='electrification'?(ANIMATION_MAP_TECHNOLOGY_LABELS[technology]??'Tecnologia indisponível')+': '+animationMapPercent(row.technologyShare):'Participação MIT: '+animationMapPercent(row.mitShare);
 return row.name+' | '+row.period+' · '+row.mode+' | '+measure+' | Mercado no recorte: '+animationMapNumber(row.marketCount)+' | Mitsubishi: '+animationMapNumber(row.mitCount)+(metric==='electrification'?' | Tecnologia selecionada: '+animationMapNumber(row.technologyCount)+' | Não classificado: '+animationMapNumber(row.unclassifiedCount):'')+' | '+row.coverage;
}
function AnimationMaps({frames=[],frame=0,metric='mitShare',technology='ALL_ELECTRIFIED',uf='',dataBase}){
 const h=jsxRuntime.jsx,hs=jsxRuntime.jsxs;
 const kind=animationMapMetric(metric),tech=animationMapTechnology(technology),selectedUF=String(uf??'').toUpperCase(),municipal=kind==='municipalVolume';
 const list=animationMapFrameList(frames),selected=animationMapCurrentFrame(frames,frame);
 const current=selected&&{...selected,selectedUF:selected.selectedUF??frames?.selectedUF};
 const scopedFrames=React.useMemo(()=>list.map(item=>({...item,selectedUF:item.selectedUF??frames?.selectedUF})),[list,frames?.selectedUF]);
 const [activeKey,setActiveKey]=React.useState(null),[query,setQuery]=React.useState('');
 const svgId=React.useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const loaded=useCatalogMunicipalGeometry(selectedUF,dataBase,municipal&&value$3.features.some(feature=>feature.uf===selectedUF));
 const geometry=loaded.data?.uf===selectedUF?loaded.data:null;
 const stateRows=React.useMemo(()=>animationMapStateRows(current,tech),[selected,tech,frames?.selectedUF]);
 const cities=React.useMemo(()=>animationMapMunicipalRows(current,selectedUF,geometry,tech),[selected,selectedUF,geometry,tech,frames?.selectedUF]);
 const domain=React.useMemo(()=>animationMapDomains(scopedFrames,kind,tech,selectedUF),[scopedFrames,kind,tech,selectedUF]);
 const rows=municipal?cities.rows:stateRows,shownRows=rows.filter(row=>catalogMapNormalize(row.name).includes(catalogMapNormalize(query)));
 const cityIndex=new Map(cities.rows.filter(row=>row.ibgeCode).map(row=>[String(row.ibgeCode),row]));
 const legendValues=[...new Set([.25,.5,1].map(ratio=>Math.ceil(domain.observedMax*ratio)))].filter(value=>value>0);
 const active=rows.find(row=>row.name===activeKey),period=current?.month??current?.date??'Período indisponível',mode=current?.mode==='ytd'?'Acumulado no ano':'Mensal';
 const title=municipal?'Concentração municipal · '+(selectedUF||'escolha uma UF'):kind==='electrification'?'Brasil · '+(ANIMATION_MAP_TECHNOLOGY_LABELS[tech]??'tecnologia indisponível'):'Brasil · participação Mitsubishi por UF';
 const validUF=value$3.features.some(feature=>feature.uf===selectedUF),valueField=municipal?'count':kind==='electrification'?'technologyShare':'mitShare';
 const unknownRows=rows.filter(row=>row[valueField]===null),positiveCities=cities.matches.filter(row=>row.count>0).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 const geoUnmatched=municipal?cities.unmatched:stateRows.filter(row=>!row.path);
 const unmatchedVolume=geoUnmatched.every(row=>animationMapNonnegative(row.count)!==null)?geoUnmatched.reduce((sum,row)=>sum+row.count,0):null;
 const extent=list.length?(list[0].month??list[0].date)+' a '+(list[list.length-1].month??list[list.length-1].date):'janela indisponível';
 const inspect=row=>({tabIndex:0,role:'button','aria-label':animationMapTooltip(row,kind,tech),'aria-pressed':activeKey===row.name,onMouseEnter:()=>setActiveKey(row.name),onFocus:()=>setActiveKey(row.name),onClick:()=>setActiveKey(row.name),onKeyDown:event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setActiveKey(row.name);}if(event.key==='Escape')setActiveKey(null);}});
 React.useEffect(()=>{setActiveKey(null);setQuery('');},[kind,selectedUF,tech]);
 const marks=municipal?(geometry?.features??[]).map(feature=>{
  const row=cityIndex.get(String(feature.code));
  return h('path',{...(row?inspect(row):{}),className:'anm-map-city','data-ibge':feature.code,d:feature.path,fill:row?.count==null?'url(#'+svgId+'-unknown)':'var(--anm-map-land)',children:h('title',{children:row?animationMapTooltip(row,kind,tech):feature.name})},feature.code);
 }):value$3.features.map(feature=>{
  const row=stateRows.find(item=>item.uf===feature.uf),fill=animationMapColor(row?.[valueField],domain.max);
  return h('path',{...inspect(row),className:'anm-map-state','data-uf':feature.uf,d:feature.path,fill:fill??'url(#'+svgId+'-unknown)',children:h('title',{children:animationMapTooltip(row,kind,tech)})},feature.uf);
 });
 const explanation='Emplacamentos observados no recorte e período de cada quadro. Nenhum valor é interpolado entre meses. Participação MIT = Mitsubishi ÷ mercado no mesmo recorte e UF; todos os filtros recebidos são preservados. Eletrificação = tecnologia selecionada ÷ mercado no mesmo recorte e UF. O denominador inclui ICE, FCEL e não classificados; eletrificados somam apenas BEV + PHEV + HEV + MHEV. As participações representam a classificação conhecida; registros não classificados podem conter outras tecnologias. Base zero, cobertura incompleta ou tecnologia indisponível geram —. No acumulado, janeiro até o quadro; reinicia a cada ano e exige cobertura completa. Domínios fixos na janela inteira de reprodução, incluindo meses não desenhados neste instante.';
 const columns=[{field:'period',label:'Período'},{field:'mode',label:'Modo'},{field:'name',label:municipal?'Município · UF':'UF',presentation:'identity'},...(municipal?[{field:'ibgeCode',label:'Código IBGE'}]:[]),{field:'count',label:'Volume no recorte',renderCell:animationMapNumber},{field:'marketCount',label:'Mercado no recorte',renderCell:animationMapNumber},{field:'mitCount',label:'Mitsubishi',renderCell:animationMapNumber},{field:'mitShare',label:'MIT / mercado',renderCell:animationMapPercent},{field:'technologyCount',label:ANIMATION_MAP_TECHNOLOGY_LABELS[tech]??'Tecnologia indisponível',renderCell:animationMapNumber},{field:'technologyShare',label:'Tecnologia / mercado',renderCell:animationMapPercent},{field:'unclassifiedCount',label:'Não classificado',renderCell:animationMapNumber},{field:'observedCount',label:'Volume observado, inclusive parcial',renderCell:animationMapNumber},{field:'coverage',label:'Cobertura'},{field:'coverageStatus',label:'Status da fonte'},{field:'geographicMatch',label:'Correspondência geográfica'}];
 let blocked=null;
 if(!current)blocked='Nenhum quadro disponível para este período. Não há substituição pelo mês anterior.';
 else if(municipal&&!validUF)blocked='Escolha uma única UF para ver a concentração municipal na malha oficial.';
 else if(municipal&&!cities.ready)blocked='Os dados municipais desta UF ainda não estão disponíveis para este quadro. Aguardando o recorte correspondente.';
 else if(municipal&&!geometry)blocked=loaded.error??'Carregando malha municipal oficial… A tabela permanece disponível.';
 return hs('section',{className:'anm-maps','aria-label':'Mapas animados · dados exatos do quadro',children:[
  hs('header',{className:'anm-map-heading',children:[hs('div',{children:[h('span',{className:'anm-map-kicker',children:'Geografia oficial · IBGE'}),h('h3',{children:title})]}),hs('div',{className:'anm-map-period',children:[h('strong',{children:period}),h('span',{children:mode})]})]}),
  current?.complete!==true&&h('p',{className:'anm-map-warning',role:'status',children:'Cobertura incompleta ou desconhecida: mapa sem valores quantitativos neste quadro. Os registros observados, quando disponíveis, ficam identificados como parciais na tabela.'}),
  kind==='electrification'&&!tech&&h('p',{className:'anm-map-warning',role:'status',children:'Tecnologia não reconhecida. Selecione BEV, PHEV, HEV, MHEV ou o conjunto explícito de eletrificados.'}),
  blocked?hs('div',{className:'anm-map-empty',role:loaded.error&&municipal?'alert':'status',children:[h('p',{children:blocked}),municipal&&loaded.error&&h('button',{type:'button',onClick:loaded.retry,children:'Tentar carregar a malha novamente'})]}):hs('div',{className:'anm-map-layout',children:[
   h('div',{className:'anm-map-viewport',children:hs('svg',{className:'anm-map-svg',viewBox:animationMapViewBox(municipal?geometry.viewBox:value$3.viewBox),role:'group','aria-label':title+' · '+period,'data-domain-max':domain.max,children:[h('title',{children:title+' · '+period}),h('desc',{children:'Áreas com traços indicam valores indisponíveis. Tab, toque ou clique revelam os números. Todos os valores também estão na tabela abaixo.'}),h('defs',{children:hs('pattern',{id:svgId+'-unknown',width:8,height:8,patternUnits:'userSpaceOnUse',children:[h('rect',{width:8,height:8,fill:'#e5e9ef'}),h('path',{d:'M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6',stroke:'#a5afbc',strokeWidth:1.3})]})}),...marks,
    ...(municipal?positiveCities.map(row=>hs('g',{...inspect(row),className:'anm-map-bubble','data-municipality':row.name,children:[h('circle',{cx:row.x,cy:row.y,r:catalogMapRadius(row.count,domain.max,28),className:'anm-map-bubble-fill'}),h('title',{children:animationMapTooltip(row,kind,tech)})]},row.ibgeCode)):[])]})}),
   hs('aside',{className:'anm-map-side',children:[h('h4',{children:'Escala fixa na reprodução'}),h('p',{children:extent}),municipal?hs(React.Fragment,{children:[domain.observedMax>0&&h('svg',{className:'anm-map-size-legend',viewBox:'0 0 180 82',role:'img','aria-label':'Área proporcional ao volume, de 0 a '+animationMapNumber(domain.observedMax),children:legendValues.map((value,index)=>hs('g',{children:[h('circle',{cx:30+index*60,cy:31,r:catalogMapRadius(value,domain.max,24),className:'anm-map-bubble-fill'}),h('text',{x:30+index*60,y:72,textAnchor:'middle',children:animationMapNumber(value)})]},value))}),h('p',{children:domain.observedMax>0?'Área das bolhas proporcional ao volume. Mesmo volume, mesma área em todos os quadros. Máximo observado: '+animationMapNumber(domain.observedMax)+'.':'Nenhum volume positivo confirmado na janela. Nenhuma bolha é desenhada.'})]}):hs(React.Fragment,{children:[h('span',{className:'anm-map-gradient','aria-hidden':true}),hs('div',{className:'anm-map-range',children:[h('span',{children:'0%'}),h('span',{children:animationMapPercent(domain.max)})]}),h('p',{children:'Cor = '+(kind==='electrification'?'participação da tecnologia selecionada':'participação MIT')+'. O domínio considera a janela inteira.'})]}),h('p',{children:'Tom claro: zero confirmado. Hachura: sem base ou cobertura incompleta.'}),municipal&&hs('figure',{className:'anm-map-inset',children:[h('svg',{viewBox:value$3.viewBox,role:'img','aria-label':selectedUF+' no Brasil',children:value$3.features.map(feature=>h('path',{d:feature.path,fill:feature.uf===selectedUF?'#155cac':'#dce5ef',stroke:'#fff',strokeWidth:1},feature.uf))}),h('figcaption',{children:selectedUF+' no Brasil'})]})]})]}),
  h('p',{className:'anm-map-inspect','aria-live':'off',children:active?animationMapTooltip(active,kind,tech):'Toque, passe o cursor ou use Tab para consultar uma área. A tabela mostra o quadro atual sem arredondar os volumes.'}),
  h('p',{className:'anm-map-note',children:unknownRows.length+' áreas com medida indisponível. '+geoUnmatched.length+' registros territoriais sem desenho ('+animationMapNumber(unmatchedVolume)+' emplacamentos); valores preservados na tabela.'}),
  municipal&&h('p',{className:'anm-map-note',children:'Bolhas em centroides das malhas municipais oficiais: '+positiveCities.length+' municípios com volume positivo, sem limite de quantidade na tabela. Correspondência única por nome normalizado + UF. Sem ponto fictício para nomes não associados. Os pontos não são endereços de compradores; centroides podem ficar fora de polígonos côncavos. A projeção é própria da UF e não permite comparar áreas geográficas entre estados.'}),
  hs('details',{className:'anm-map-method',children:[h('summary',{children:'Medidas, cobertura e fontes'}),h('p',{children:explanation}),h('a',{href:'https://servicodados.ibge.gov.br/api/docs/malhas',target:'_blank',rel:'noreferrer',children:'Malhas oficiais · IBGE'})]}),
  hs('label',{className:'anm-map-search',children:['Buscar na tabela do quadro',h('input',{type:'search',value:query,onChange:event=>setQuery(event.target.value),'aria-label':'Buscar na tabela do mapa animado',placeholder:municipal?'Município':'UF'})]}),
  h(MarketTable,{id:'animation-map-'+svgId+'-table',title:title+' · '+period+' · dados exatos',rows:shownRows,scope:[{field:'period',label:'Período',value:String(period)},{field:'mode',label:'Modo',value:mode},...(municipal?[{field:'uf',label:'UF do desenho',value:selectedUF}]:[])],columns,description:explanation+' '+shownRows.length+' de '+rows.length+' áreas na tabela. Geografia sem correspondência permanece na lista.',onSelect:row=>setActiveKey(row.name)})
 ]});
}
