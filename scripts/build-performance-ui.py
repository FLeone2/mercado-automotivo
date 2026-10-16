"""Idempotently embed stale-chart UI after feature builds, before page notes."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def build(html):
 block='// BEGIN PERFORMANCE UI\n'+(root/'src/performance-ui.js').read_text()+'\n// END PERFORMANCE UI\n'
 if '// BEGIN PERFORMANCE UI' in html:
  html=re.sub(r'// BEGIN PERFORMANCE UI.*?// END PERFORMANCE UI\n?',lambda _:block,html,flags=re.S)
 else:
  assert 'function useMarketData(' in html
  html=html.replace('function useMarketData(',block+'function useMarketData(',1)
 # Delimit the existing main branch rather than copying the giant generated render.
 start="!mapReady?jsxRuntime.jsxs('div'"
 end="\n   ]})\n  ]})\n  , tab!=='quality'&&jsxRuntime.jsx(CatalogExtras"
 if '/* BEGIN MAIN CHART SNAPSHOT */' not in html:
  assert html.count(start)==1,'Main branch anchor changed'
  assert html.count(end)==1,'Main branch ending changed'
  opening="/* BEGIN MAIN CHART SNAPSHOT */jsxRuntime.jsx(PendingChartSnapshot,{pending,error,ready:mapReady&&Boolean(model),compatibilityKey:JSON.stringify([tab,evolutionView,mapView,overviewMapView,grain,manifest?.schemaVersion]),label:performanceFilterLabel(effectiveFilters),children:"
  html=html.replace(start,opening+start,1)
  html=html.replace(end,"\n   ]})})/* END MAIN CHART SNAPSHOT */\n  ]})\n  , tab!=='quality'&&jsxRuntime.jsx(CatalogExtras",1)
 html=html.replace('open: exportOpen, onClose: ()=>setExportOpen(false), model: model,', 'open: exportOpen&&!pending&&Boolean(model)&&resultKey===requestKey, onClose: ()=>setExportOpen(false), model: model,')
 return html
if __name__=='__main__':
 p=root/'index.html';p.write_text(build(p.read_text()));print('Performance UI embedded. Run build-page-notes.py last.')
