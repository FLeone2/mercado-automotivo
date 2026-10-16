"""Keep national-context navigation independent of filtered chart loading."""
from pathlib import Path
root=Path(__file__).resolve().parents[1];p=root/'index.html';html=p.read_text()
old="const globalFilters={...Object.fromEntries((snapshot.filters??[]).map(f=>[f.id,f.defaultValue??'all'])),...filters};"
new="const globalFilters=primaryMapCanonicalMunicipalityFilters({...Object.fromEntries((snapshot.filters??[]).map(f=>[f.id,f.defaultValue??'all'])),...filters});"
if old in html:html=html.replace(old,new,1)
assert new in html
# The national-context query ignores geographic selectors and remains valid
# during UF/city navigation. It must not be an inert child of chart recomputation.
oldmap="      , jsxRuntime.jsx('div', { className:'am-overview-map-slot', children: jsxRuntime.jsx(PrimaryMap, { id:'overview-map', model:overviewMapModel, filters:effectiveFilters, scope:overviewMapScope, dataBase:getBase(snapshot), setFilter:setPrimaryMapFilter, view:overviewMapView, setView:setOverviewMapView, pending:overviewMapQuery.pending, error:overviewMapQuery.error })})\n"
if oldmap in html:html=html.replace(oldmap,'',1)
geo="jsxRuntime.jsx(PrimaryMap, { id:'territories-primary-map', model:primaryMapQuery?.result, filters, scope, dataBase, setFilter, view:mapView, setView:setMapView, pending:primaryMapQuery?.pending, error:primaryMapQuery?.error })"
html=html.replace(geo,"null /* Primary map is rendered outside the filtered-chart loading boundary. */",1)
anchor="  , ['explore','structure'].includes(tab)?"
mapblock="""  , ['dashboard','geography'].includes(tab)&&mapReady&&jsxRuntime.jsx(PendingChartSnapshot,{pending:overviewMapQuery.pending,error:overviewMapQuery.error,ready:Boolean(overviewMapModel),compatibilityKey:JSON.stringify(['independent-primary-map',tab,effectiveFilters.uf]),label:performanceFilterLabel(overviewMapFilters),children:jsxRuntime.jsx(PrimaryMap,{...(tab==='dashboard'?{id:'overview-map'}:{id:'territories-primary-map'}),model:overviewMapModel,filters:effectiveFilters,scope:overviewMapScope,dataBase:getBase(snapshot),setFilter:setPrimaryMapFilter,view:tab==='geography'?mapView:overviewMapView,setView:tab==='geography'?setMapView:setOverviewMapView,pending:overviewMapQuery.pending,error:overviewMapQuery.error})})
"""
if "['independent-primary-map',tab" not in html:
 assert html.count(anchor)==1
 html=html.replace(anchor,mapblock+anchor,1)
# Give stable national context first admission on startup, then compute the
# selected charts. Subsequent geography changes leave the context request alone.
main=" const {manifest,result:model,pending,progress,error,manifestError,requestKey,key:resultKey}=useMarketData(effectiveFilters,marketEnabled,tab);\n"
mapquery=" const overviewMapQuery=useMarketData(overviewMapFilters,['dashboard','geography'].includes(tab)&&mapReady,'primary-map',false);\n"
if html.index(main)<html.index(mapquery):
 html=html.replace(main,'',1).replace(mapquery,mapquery+main,1)
html=html.replace('view:evolutionView,filters:effectiveFilters,scope})','view:evolutionView,filters:effectiveFilters,scope,manifest})')
html=html.replace("PrimaryMap,{id:tab==='dashboard'?'overview-map':'territories-primary-map',", "PrimaryMap,{...(tab==='dashboard'?{id:'overview-map'}:{id:'territories-primary-map'}),")
p.write_text(html)
