import importlib.util,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('overview_refinements',ROOT/'scripts/build-overview-refinements.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
class OverviewRefinements(unittest.TestCase):
 def test_equal_chart_heights_and_idempotence(self):
  source=(ROOT/'index.html').read_text();result=build.transform(source)
  self.assertEqual(result,build.transform(result))
  for name in ['overview-trend','overview-brands']:self.assertRegex(result,r'id: "'+name+r'",[^\n]*?height: 320')
  strip=lambda s:re.sub(r'<style id="overview-refinements-styles">.*?</style>\n?','',s,flags=re.S)
  normalize=lambda s:re.sub(r'(id: "overview-(?:trend|brands)",[^\n]*?height: )\d+',r'\g<1>HEIGHT',strip(s))
  self.assertEqual(normalize(source),normalize(result))
 def test_scoped_centering_and_responsive_stack(self):
  css=(ROOT/'src/overview-refinements.css').read_text()
  self.assertIn('repeat(2,minmax(0,1fr))',css);self.assertIn('max-width:960px;justify-self:center',css)
  self.assertIn('max-width:820px;margin-inline:auto',css);self.assertIn('@media(max-width:1000px)',css)
  self.assertNotIn('position:absolute',css);self.assertNotIn('order:',css)
