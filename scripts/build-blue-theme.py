"""Add the blue theme to the native picker; preserve its storage/preview/export flow."""
from pathlib import Path
import json, re, subprocess, sys
root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
theme = json.loads((root / 'src/blue-theme.json').read_text())
assert len(theme['tokens']) == len(theme['darkTokens']) == 27
start, end = '/* BEGIN MARKET BLUE THEME */', '/* END MARKET BLUE THEME */'
block = start + 'T5.push(' + json.dumps(theme, ensure_ascii=False, separators=(',', ':')) + ');' + end
if start in html:
    html = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, html, flags=re.S)
else:
    assert html.count('function E5(e,t=') == 1
    html = html.replace('function E5(e,t=', block + 'function E5(e,t=')
css = '<style id="market-blue-theme-styles">\n' + (root / 'src/blue-theme.css').read_text() + '\n</style>'
if '<style id="market-blue-theme-styles">' in html:
    html = re.sub(r'<style id="market-blue-theme-styles">.*?</style>', lambda _: css, html, flags=re.S)
else:
    html = html.replace('</head>', css + '\n</head>')
p.write_text(html)
subprocess.run([sys.executable, str(root / 'scripts/build-ranking.py')], check=True)
