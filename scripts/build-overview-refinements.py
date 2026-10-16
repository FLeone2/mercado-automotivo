"""Embed narrowly scoped overview refinements before final page-notes/CSP build."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def transform(html):
 for chart in ['overview-trend','overview-brands']:
  pattern=r'(id: "'+chart+r'",[^\n]*?height: )\d+'
  html,count=re.subn(pattern,r'\g<1>320',html,count=1)
  assert count==1,chart+' chart anchor missing'
 css='<style id="overview-refinements-styles">\n'+(ROOT/'src/overview-refinements.css').read_text()+'\n</style>'
 if '<style id="overview-refinements-styles">' in html:html=re.sub(r'<style id="overview-refinements-styles">.*?</style>',lambda _:css,html,flags=re.S)
 else:html=html.replace('</head>',css+'\n</head>',1)
 return html
if __name__=='__main__':
 p=ROOT/'index.html';p.write_text(transform(p.read_text()))
