"""Embed competition-only layout and complete the model comparison columns.

Run before build-page-notes.py so final CSP hashes include the patched source.
"""
from pathlib import Path
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]
OLD_ROOT = "tab==='competition'&&jsxRuntime.jsxs(jsxRuntime.Fragment, { children: ["
NEW_ROOT = "tab==='competition'&&jsxRuntime.jsxs('div', { className:'am-competition-view', children: ["
OLD_COLUMNS = "columns: [column('name','Modelo','identity'),countColumn,shareColumn,column('previous','Período anterior')]"
NEW_COLUMNS = "columns: [column('name','Modelo','identity'),countColumn,shareColumn,column('previous','Período anterior'),{field:'changeRate',label:'Variação',renderCell:signed},{field:'shareChange',label:'Δ participação',renderCell:v=>v==null?'—':`${v>0?'+':''}${(v*100).toLocaleString('pt-BR',{maximumFractionDigits:2})} p.p.`}]"


def transform(html):
    if OLD_ROOT in html:
        assert html.count(OLD_ROOT) == 1, 'Competition root must be unique'
        html = html.replace(OLD_ROOT, NEW_ROOT, 1)
    assert html.count(NEW_ROOT) == 1, 'Competition root anchor changed'
    # Restrict the column patch to this specific table; preserve all row data,
    # filters, comparison periods, search, sorting and export adapters.
    pattern = r'(id: "models-detail",[^\n]*?)(columns: \[column\(\x27name\x27,\x27Modelo\x27,\x27identity\x27\)[^\n]*?\],)'
    matches = list(re.finditer(pattern, html))
    assert len(matches) == 1, 'Model detail table anchor changed'
    match = matches[0]
    current = match[2][:-1]
    assert current in (OLD_COLUMNS, NEW_COLUMNS), 'Model detail columns changed'
    html = html[:match.start(2)] + NEW_COLUMNS + ',' + html[match.end(2):]
    css = (ROOT / 'src/competition-fixes.css').read_text()
    style = '<style id="competition-fixes-styles">\n' + css + '\n</style>'
    if '<style id="competition-fixes-styles">' in html:
        html = re.sub(r'<style id="competition-fixes-styles">.*?</style>', lambda _: style, html, flags=re.S)
    else:
        assert '</head>' in html, 'Document head missing'
        html = html.replace('</head>', style + '\n</head>', 1)
    return html


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    source = ROOT / 'index.html'
    (args.output or source).write_text(transform(source.read_text()))
    print('Embedded scoped competition layout and model comparison columns.')
