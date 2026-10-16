"""Embed only the two approved additive Evolution panels and refresh worker/CSP."""
from pathlib import Path
import re, subprocess, sys
root=Path(__file__).resolve().parents[1]
p=root/'index.html';html=p.read_text()
a=html.index('function useMarketData(');b=html.index('function Empty(',a);hook=html[a:b]
if 'includeInteractive=' not in hook:
 hook=hook.replace('const signature=canonicalFilterKey(filters),',"const includeInteractive=mode==='interactive';\n const signature=canonicalFilterKey(filters),")
 hook=hook.replace('({manifest,signature,base,','({includeInteractive,manifest,signature,base,').replace('[manifest,signature,base,','[includeInteractive,manifest,signature,base,')
 hook=hook.replace('postMessage({id,manifest,filters,base,','postMessage({id,includeInteractive,manifest,filters,base,')
html=html[:a]+hook+html[b:]
start,end='// BEGIN EVOLUTION INTERACTIVE','// END EVOLUTION INTERACTIVE'
block=start+'\n'+'\n'.join((root/'src'/name).read_text() for name in ['evolution-brush.js','evolution-years.js'])+'\n'+end+'\n'
if start in html:html=re.sub(re.escape(start)+r'.*?'+re.escape(end)+'\n?',lambda _:block,html,flags=re.S)
else:html=html.replace('function useMarketData(',block+'function useMarketData(',1)
mount="\n    , tab==='history'&&jsxRuntime.jsx(EvolutionInteractive,{key:evolutionView,view:evolutionView,filters:effectiveFilters,scope})"
if 'jsxRuntime.jsx(EvolutionInteractive,' not in html:
 anchor="    , tab==='history'&&jsxRuntime.jsx(HistoryView, { view:evolutionView, model: model, scope: scope, filters: effectiveFilters, setFilter: setFilter, grain: grain, setGrain: setGrain,})"
 assert anchor in html
 html=html.replace(anchor,anchor+mount,1)
for name in ['evolution-brush','evolution-years']:
 css='<style id="'+name+'-styles">\n'+(root/'src'/(name+'.css')).read_text()+'\n</style>'
 if '<style id="'+name+'-styles">' in html:html=re.sub(r'<style id="'+name+r'-styles">.*?</style>',lambda _:css,html,flags=re.S)
 else:html=html.replace('</head>',css+'\n</head>',1)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-evolution.py')],check=True)
