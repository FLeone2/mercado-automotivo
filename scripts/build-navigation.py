"""Embed grouped navigation and refresh inline script CSP through the shared builder."""
from pathlib import Path
import re,subprocess,sys
root=Path(__file__).resolve().parents[1]
p=root/'index.html';html=p.read_text()
a=html.index('// BEGIN MARKET NAVIGATION');b=html.index('// END MARKET NAVIGATION',a)
html=html[:a]+'// BEGIN MARKET NAVIGATION\n'+(root/'src/navigation.js').read_text()+html[b:]
html=re.sub(r'(<style id="market-navigation-styles">).*?(</style>)',lambda m:m[1]+'\n'+(root/'src/navigation.css').read_text()+'\n'+m[2],html,flags=re.S)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-ranking.py')],check=True)
