"""Embed maintained Evolution sources, then run the shared build/CSP validation."""
from pathlib import Path
import re,json,subprocess
root=Path(__file__).resolve().parents[1]
p=root/'index.html';html=p.read_text()
a=html.index('// BEGIN EVOLUTION VIEWS');b=html.index('// END EVOLUTION VIEWS',a)
html=html[:a]+'// BEGIN EVOLUTION VIEWS\n'+(root/'src/evolution-views.js').read_text()+html[b:]
html=re.sub(r'(<style id="evolution-views-styles">).*?(</style>)',lambda m:m[1]+'\n'+(root/'src/evolution-views.css').read_text()+'\n'+m[2],html,flags=re.S)
found=0
def worker(m):
 global found
 if 'installMarketWorker' not in json.loads(m[1]):return m[0]
 found+=1
 return 'new Blob(['+json.dumps((root/'src/performance-cache.js').read_text()+'\n'+(root/'src/evolution-market-worker.js').read_text(),ensure_ascii=False)
html=re.sub(r'new Blob\(\[("(?:[^"\\]|\\.)*")',worker,html)
assert found==1
p.write_text(html)
subprocess.run(['python',str(root/'scripts/build-ranking.py')],check=True)
