"""Embed scenario UI/CSS only; never regenerate data or replace navigation."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def transform(html):
 start,end='// BEGIN SCENARIOS UI','// END SCENARIOS UI'
 assert html.count(start)==html.count(end)==1
 a=html.index(start);b=html.index(end,a)+len(end)
 html=html[:a]+start+'\n'+(ROOT/'src/scenarios.js').read_text()+end+html[b:]
 style='<style id="scenarios-styles">\n'+(ROOT/'src/scenarios.css').read_text()+'\n</style>'
 html,count=re.subn(r'<style id="scenarios-styles">.*?</style>',lambda _:style,html,flags=re.S);assert count==1
 return html
if __name__=='__main__':
 p=ROOT/'index.html';p.write_text(transform(p.read_text()))
