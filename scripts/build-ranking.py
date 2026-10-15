"""Re-embed maintained ranking presentation and refresh exact inline-script CSP hashes."""
from pathlib import Path
import re, hashlib, base64
root=Path(__file__).resolve().parents[1]
p=root/'index.html';html=p.read_text()
a=html.index('// BEGIN RANKING VIEWS');b=html.index('// END RANKING VIEWS',a)
html=html[:a]+'// BEGIN RANKING VIEWS\n'+(root/'src/ranking-views.js').read_text()+html[b:]
html=re.sub(r'(<style id="ranking-views-styles">).*?(</style>)',lambda m:m[1]+'\n'+(root/'src/ranking-views.css').read_text()+'\n'+m[2],html,flags=re.S)
p.write_text(html)
scripts=[m[1] for m in re.finditer(r'<script>(.*?)</script>',html,re.S)]
assert len(scripts)==2
hashes=' '.join("'sha256-"+base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()+"'" for script in scripts)
h=root/'_headers';headers=h.read_text();headers=re.sub(r"script-src 'self' .*? blob:;", "script-src 'self' "+hashes+" blob:;",headers);h.write_text(headers)
for i,script in enumerate(scripts):
 import subprocess,tempfile
 with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
  f.write(script);f.flush();subprocess.run(['node','--check',f.name],check=True)
print('Embedded ranking sources; both executable inline scripts parse and have exact CSP hashes.')
