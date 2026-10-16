"""Run LAST after all source embeds; explicit JSX adaptation, no runtime DOM mutation."""
from pathlib import Path
import re,hashlib,base64,argparse,sys
ROOT=Path(__file__).resolve().parents[1]
CLASSES='am-footnote|am-market-view-note|ev-interactive-note|catalog-method|cc-method|tc-intro|tc-panel-note|anm-map-note'
def transform_source(html):
    # Cenários owns its disclosure footer; do not route its notes to a second footer.
    scenario_block=None
    start,end='// BEGIN SCENARIOS UI','// END SCENARIOS UI'
    if start in html and end in html:
        a=html.index(start);b=html.index(end,a)+len(end)
        scenario_block=html[a:b]
        html=html[:a]+'/* SCENARIO OWNED NOTES PLACEHOLDER */'+html[b:]
    # Preserve the original semantic tag without parsing or changing child expressions.
    pattern=r"(jsxRuntime\.(?:jsx|jsxs)\()(['\"])(p|div)\2(,\s*\{)(\s*className:\s*['\"](?:"+CLASSES+r")[ '\"]*)"
    html=re.sub(pattern,lambda m:m[1]+'PageNote'+m[4]+"originalTag:'"+m[3]+"',"+m[5],html)
    html=re.sub(r"((?:scenarioH|h|hs)\()(['\"])p\2(,\s*\{className:\s*['\"](?:"+CLASSES+r")[ '\"]*)",lambda m:m[1]+'PageNote'+m[3],html)
    html=html.replace("scenarioH('details',{className:'am-scenario-method'},", "scenarioH(PageNoteBlock,{className:'am-scenario-method'},")
    # Only the three maintained adapters; arbitrary evidence components remain untouched.
    for name,old,new in [('MarketChart','dataApp.EvidenceChart','PageNotedEvidenceChart'),('MarketTable','dataApp.DataComponent','PageNotedDataComponent'),('ScenarioChart','dataApp.EvidenceChart','PageNotedEvidenceChart')]:
        pattern=r'(function '+name+r'\([^\n]+?return jsxRuntime\.jsx\()'+re.escape(old)+r'(?=,)'
        html=re.sub(pattern,lambda m:m[1]+new,html,count=1)
    html=re.sub(r"((?:h|hs)\()(['\"])details\2(,\s*\{className:\s*['\"]anm-map-method['\"])",lambda m:m[1]+'PageNoteBlock'+m[3],html)
    if scenario_block is not None:
        html=html.replace('/* SCENARIO OWNED NOTES PLACEHOLDER */',scenario_block,1)
    return html

def transform(html):
    js=(ROOT/'src/page-notes.js').read_text();css=(ROOT/'src/page-notes.css').read_text()
    start,end='// BEGIN PAGE NOTES','// END PAGE NOTES'
    if start in html:
        html=re.sub(re.escape(start)+r'.*?'+re.escape(end),lambda m:start+'\n'+js+'\n'+end,html,flags=re.S)
    else:
        anchor='function getMarketFooterContext()'
        assert anchor in html,'Main app footer context not found'
        html=html.replace(anchor,start+'\n'+js+'\n'+end+'\n'+anchor,1)
    style='<style id="page-notes-styles">\n'+css+'\n</style>'
    if '<style id="page-notes-styles">' in html:html=re.sub(r'<style id="page-notes-styles">.*?</style>',lambda m:style,html,flags=re.S)
    else:html=html.replace('</head>',style+'\n</head>',1)
    html=transform_source(html)
    anchor="jsxRuntime.jsxs('div', { className: 'am-app'+"
    replacement="jsxRuntime.jsxs(PageNotesLayout, { notesScope:[tab,evolutionView,scenarioView].join('|'), className: 'am-app'+"
    if anchor in html:html=html.replace(anchor,replacement,1)
    else:assert replacement in html,'Main app root anchor changed'
    return html
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);parser.add_argument('--source-only',type=Path);args=parser.parse_args()
    if args.source_only:
        sys.stdout.write(transform_source(args.source_only.read_text()));sys.exit(0)
    page=ROOT/'index.html';html=transform(page.read_text());(args.output or page).write_text(html)
    if not args.output:
        hashes=' '.join("'sha256-"+base64.b64encode(hashlib.sha256(m[1].encode()).digest()).decode()+"'" for m in re.finditer(r'<script>(.*?)</script>',html,re.S))
        headers=ROOT/'_headers';headers.write_text(re.sub(r"script-src 'self' .*? blob:;","script-src 'self' "+hashes+" blob:;",headers.read_text()))
    print('Embedded explicit explanation notes, React-owned footer and responsive finishing.')
