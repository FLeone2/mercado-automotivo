"""Embed UF channel composition, preserving navigation, reviewed data and workers."""
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
page = root / 'index.html'
html = page.read_text()
start_marker = '// BEGIN TERRITORY CHANNELS'
end_marker = '// END TERRITORY CHANNELS'
source = (root / 'src/territory-channels.js').read_text()
if start_marker in html:
    start = html.index(start_marker)
    end = html.index(end_marker, start)
    html = html[:start] + start_marker + '\n' + source + html[end:]
else:
    anchor = 'function GeographyView('
    assert html.count(anchor) == 1
    html = html.replace(anchor, start_marker + '\n' + source + end_marker + '\n\n' + anchor)

style_id = 'territory-channel-styles'
css = (root / 'src/territory-channels.css').read_text()
if f'<style id="{style_id}">' in html:
    html = re.sub(r'(<style id="' + style_id + r'">).*?(</style>)', lambda m: m[1] + '\n' + css + '\n' + m[2], html, flags=re.S)
else:
    assert html.count('</head>') == 1
    html = html.replace('</head>', f'<style id="{style_id}">\n{css}\n</style>\n</head>')

component = ", jsxRuntime.jsx(TerritoryChannelMap, { model, filters, scope, onSelect: value => setFilter('uf', value) })"
if component not in html:
    # Immediately below the existing state map/ranking, before municipal drilldown.
    anchor = '    , data.isChannel && jsxRuntime.jsxs(\'div\', { className: "am-geography-definition"'
    assert html.count(anchor) == 1
    html = html.replace(anchor, '    ' + component + '\n' + anchor)

page.write_text(html)
# The source worker carries the UF × channel aggregation. Each downstream
# builder reads the current page and preserves unrelated authored sections.
subprocess.run([sys.executable, str(root / 'scripts/build-evolution.py')], check=True)
subprocess.run([sys.executable, str(root / 'scripts/build-navigation.py')], check=True)
print('Embedded territory channel map, UF list and worker aggregation; navigation and CSP refreshed.')
