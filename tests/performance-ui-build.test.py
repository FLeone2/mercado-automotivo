"""Guard generated main-view anchors and repeatable source embedding."""
import re, runpy, subprocess, tempfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
build = runpy.run_path(str(root/'scripts/build-performance-ui.py'))['build']
original = (root/'index.html').read_text()
output = build(original)
assert output == build(output), 'Build must be idempotent'
assert output.count('/* BEGIN MAIN CHART SNAPSHOT */') == 1
assert 'open: exportOpen&&!pending&&Boolean(model)&&resultKey===requestKey' in output
assert '[tab,evolutionView,mapView,overviewMapView,grain,manifest?.schemaVersion]' in output
for source in re.findall(r'<script[^>]*>(.*?)</script>', output, re.S):
 if 'function useMarketData(' in source:
  with tempfile.NamedTemporaryFile(suffix='.js') as f:
   f.write(source.encode()); f.flush()
   subprocess.run(['node','--check',f.name],check=True)
print('PASS performance UI build: stable anchors, repeatability, export guard, full generated JavaScript syntax.')
