"""Embed shared aesthetic rules without changing authored components or data."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def transform(html):
 style='<style id="shared-layout-refinements-styles">\n'+(ROOT/'src/shared-layout-refinements.css').read_text()+'\n</style>'
 if '<style id="shared-layout-refinements-styles">' in html:html=re.sub(r'<style id="shared-layout-refinements-styles">.*?</style>',lambda _:style,html,flags=re.S)
 else:html=html.replace('</head>',style+'\n</head>',1)
 return html
if __name__=='__main__':
 p=ROOT/'index.html';p.write_text(transform(p.read_text()))
