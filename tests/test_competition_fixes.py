"""Source/build regression tests; browser geometry is verified separately."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('competition_fixes', ROOT / 'scripts/build-competition-fixes.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class CompetitionFixesTests(unittest.TestCase):
    def test_patch_is_idempotent_and_narrow(self):
        before = (ROOT / 'index.html').read_text()
        after = build.transform(before)
        self.assertEqual(build.transform(after), after)
        self.assertEqual(after.count('<style id="competition-fixes-styles">'), 1)
        self.assertEqual(after.count(build.NEW_ROOT), 1)
        self.assertIn(build.NEW_COLUMNS, after)
        # Only the page wrapper, model columns and the owned CSS block change.
        import re
        strip = lambda s: re.sub(r'<style id="competition-fixes-styles">.*?</style>\n?', '', s, flags=re.S)
        normalize = lambda s: strip(s).replace(build.NEW_ROOT, build.OLD_ROOT).replace(build.NEW_COLUMNS, build.OLD_COLUMNS)
        self.assertEqual(normalize(before), normalize(after))

    def test_no_dom_reparenting_or_global_grid_rule(self):
        css = (ROOT / 'src/competition-fixes.css').read_text()
        self.assertIn('.am-competition-view .data-section{grid-template-columns:minmax(0,1fr)}', css)
        self.assertIn('.am-competition-view .data-section>*{grid-column:1/-1;min-width:0;max-width:100%}', css)
        self.assertIn('.am-competition-view .data-section>.am-footnote{', css)
        self.assertNotIn('@media', css)  # Applies consistently at all widths.
        for term in ['appendChild', 'removeChild', 'MutationObserver', 'innerHTML']:
            self.assertNotIn(term, Path(build.__file__).read_text())

    def test_model_columns_match_existing_brand_comparisons(self):
        html = build.transform((ROOT / 'index.html').read_text())
        import re
        columns = lambda table: re.search(r'id: "' + table + r'",[^\n]*?columns: (\[.*?\]),', html)[1]
        brand = columns('competition-table')
        model = columns('models-detail')
        self.assertEqual(brand.replace("'Marca'", "'Modelo'"), model)
        self.assertIn('shareChange:comparisonAvailable&&prior.total?', html)
        self.assertIn('changeRate:comparisonAvailable&&pmap.get(name)>0?', html)


if __name__ == '__main__':
    unittest.main()
