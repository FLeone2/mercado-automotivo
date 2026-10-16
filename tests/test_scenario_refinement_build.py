import importlib.util,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
 s=importlib.util.spec_from_file_location(name,ROOT/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
build=load('scenario_refinements','scripts/build-scenario-refinements.py');notes=load('page_notes_refinements','scripts/build-page-notes.py')
class ScenarioRefinementBuild(unittest.TestCase):
 def test_narrow_idempotent_embed(self):
  source=(ROOT/'index.html').read_text();result=build.transform(source)
  self.assertEqual(result,build.transform(result))
  strip=lambda s:re.sub(r'<style id="scenarios-styles">.*?</style>','',re.sub(r'// BEGIN SCENARIOS UI.*?// END SCENARIOS UI','',s,flags=re.S),flags=re.S)
  self.assertEqual(strip(source),strip(result))
 def test_generic_notes_do_not_split_scenario_footer(self):
  source='// BEGIN SCENARIOS UI\n'+(ROOT/'src/scenarios.js').read_text()+'// END SCENARIOS UI'
  self.assertEqual(source,notes.transform_source(source))
 def test_responsive_hierarchy_never_hides_visuals(self):
  css=(ROOT/'src/scenarios.css').read_text().split('/* Visual-first scenario hierarchy.')[1]
  self.assertNotIn('display:none',css);self.assertNotIn('visibility:hidden',css)
  self.assertIn('minmax(0,1fr)',css);self.assertIn('max-width:700px',css);self.assertIn('am-scenario-technical-footer',css)
