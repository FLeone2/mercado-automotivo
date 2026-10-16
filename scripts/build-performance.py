"""Embed the session query broker and safe retained-chart UI. Does not publish."""
from pathlib import Path
import re,subprocess,sys
root=Path(__file__).resolve().parents[1];p=root/'index.html';html=p.read_text()
start,end='// BEGIN SHARED QUERY SERVICE','// END SHARED QUERY SERVICE'
block=start+'\n'+(root/'src/query-service.js').read_text()+'\n'+end+'\n'
if start in html:html=re.sub(re.escape(start)+r'.*?'+re.escape(end)+'\n?',lambda _:block,html,flags=re.S)
else:html=html.replace('function useMarketData(',block+'function useMarketData(',1)
a=html.index('function useMarketData(');b=html.index('function Empty(',a);hook=html[a:b]
hook=hook.replace('new InlineCalculationWorker$1()',"createSharedQueryWorker(()=>new InlineCalculationWorker$1(),'market')") if "createSharedQueryWorker(" not in hook else hook
hook=hook.replace("{type:'cancel',releaseCubes:true}","{type:'cancel'}")
html=html[:a]+hook+html[b:]
# Embedded UMD/CommonJS helpers may assign module.exports. The authored content
# owns its original exports object; restore that identity at its final boundary.
anchor='exports.DashboardContent = DashboardContent;'
guard='// Restore authored exports after embedded CommonJS helper initialization.\nif(typeof module!=="undefined")module.exports = exports;\n'
assert html.count(anchor)==1,'Authored module export boundary changed'
if guard not in html:html=html.replace(anchor,guard+anchor,1)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-performance-ui.py')],check=True)
