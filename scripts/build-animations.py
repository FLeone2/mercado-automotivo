"""Embed the approved animation workspace and its isolated calculation worker."""
from pathlib import Path
import json,re,subprocess,sys
root=Path(__file__).resolve().parents[1];p=root/'index.html';html=p.read_text()
nav=root/'src/navigation.js';s=nav.read_text()
if "id:'animations'" not in s:
 s=s.replace("{id:'models',label:'Cenários',previousLabels", "{id:'animations',label:'Animações'},{id:'models',label:'Cenários',previousLabels",1)
 s=s.replace(" {id:'models',label:'Cenários',routes:['models']}"," {id:'models',label:'Cenários',routes:['models']},\n {id:'animations',label:'Animações',routes:['animations']}")
 nav.write_text(s)
a=html.index('// BEGIN MARKET NAVIGATION');b=html.index('// END MARKET NAVIGATION',a)
html=html[:a]+'// BEGIN MARKET NAVIGATION\n'+s+html[b:]
files=['animations-data.js','animations-charts.js','animations-maps.js','animations.js']
worker=(root/'src/performance-cache.js').read_text()+'\n'+(root/'src/animations-data.js').read_text()+'\n'+(root/'src/animations-worker.js').read_text()
block='// BEGIN ANIMATIONS WORKSPACE\nconst ANIMATIONS_WORKER_SOURCE='+json.dumps(worker,ensure_ascii=True)+';\n'+'\n'.join((root/'src'/f).read_text() for f in files)+'\n// END ANIMATIONS WORKSPACE\n'
if '// BEGIN ANIMATIONS WORKSPACE' in html:html=re.sub(r'// BEGIN ANIMATIONS WORKSPACE.*?// END ANIMATIONS WORKSPACE\n?',lambda _:block,html,flags=re.S)
else:html=html.replace('function useMarketData(',block+'function useMarketData(',1)
html=html.replace("const marketEnabled=!['quality','models','explore','structure'].includes(tab)","const marketEnabled=!['quality','models','explore','structure','animations'].includes(tab)")
mount="tab==='animations'?jsxRuntime.jsx(AnimationWorkspace,{manifest,filters:effectiveFilters,scope}):"
if mount not in html:
 anchor="   , !mapReady?jsxRuntime.jsxs('div'"
 assert anchor in html,'Main view anchor missing'
 html=html.replace(anchor,"   , "+mount+"!mapReady?jsxRuntime.jsxs('div'",1)
for name in ['animations','animations-charts','animations-maps']:
 source=root/'src'/(name+'.css')
 if not source.exists():continue
 css='<style id="'+name+'-styles">\n'+source.read_text()+'\n</style>'
 if '<style id="'+name+'-styles">' in html:html=re.sub(r'<style id="'+name+r'-styles">.*?</style>',lambda _:css,html,flags=re.S)
 else:html=html.replace('</head>',css+'\n</head>',1)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-ranking.py')],check=True)
print('Animations workspace embedded; existing leaf routes preserved.')
