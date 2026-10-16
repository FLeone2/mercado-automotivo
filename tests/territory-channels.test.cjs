const publishedSource=require('node:child_process').execFileSync('python',['scripts/build-page-notes.py','--source-only','src/territory-channels.js'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'});
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), zlib = require('node:zlib'), assert = require('node:assert/strict'), { webcrypto } = require('node:crypto');
const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src/territory-channels.js'), 'utf8');
const geometry = JSON.parse(JSON.parse(html.match(/const value\$3 = JSON.parse\(("(?:[^"\\]|\\.)*")\)/)[1]));
const workerSource = fs.readFileSync(path.join(root, 'src/performance-cache.js'), 'utf8')+'\n'+fs.readFileSync(path.join(root, 'src/evolution-market-worker.js'), 'utf8');
const embeddedWorker = [...html.matchAll(/new Blob\(\[("(?:[^"\\]|\\.)*")\]/g)].map(match => JSON.parse(match[1])).find(text => text.includes('installMarketWorker'));
assert.equal(embeddedWorker, workerSource, 'The published worker must match its maintained source');
assert(html.includes('// BEGIN TERRITORY CHANNELS\n' + publishedSource), 'Published component must match its maintained source');
assert(html.includes(fs.readFileSync(path.join(root, 'src/territory-channels.css'), 'utf8')));
assert(html.indexOf('jsxRuntime.jsx(TerritoryChannelMap, { model, filters, scope,') > html.indexOf('id: "geo-uf-ranking"'));
assert(html.includes("{id:'territories-primary-map'}"));
assert(html.includes("['independent-primary-map',tab"));
assert(html.indexOf('jsxRuntime.jsx(TerritoryChannelMap, { model, filters, scope,') < html.indexOf('id: "geo-municipal-heading"')); 

let slots = [], cursor = 0;
const React = { useMemo: fn => fn(), useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => slots[index] = typeof value === 'function' ? value(slots[index]) : value]; } };
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const context = vm.createContext({ React, jsxRuntime: { jsx, jsxs: jsx }, dataApp: { Section: 'section', DataComponent: 'data-component' }, MarketTable: 'market-table', value$3: geometry, number: value => value == null ? '—' : new Intl.NumberFormat('pt-BR').format(value), percent: value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value) });
vm.runInContext(source + ';globalThis.api={territoryChannelAnalysis,territoryChannelGeometry,territoryPolygonArea,territoryAreaBefore,territoryAreaCut,TerritoryChannelMap,TerritoryChannelDetails};', context);
const api = context.api, portable = value => JSON.parse(JSON.stringify(value));
const workerContext = vm.createContext({ console, DOMException, TextEncoder, TextDecoder, URL, Blob, Response, DecompressionStream, AbortController, crypto: webcrypto, setTimeout });
vm.runInContext(workerSource.replace(/\}\)\(\);\s*$/, 'globalThis.api={installMarketWorker};})();'), workerContext);
const fullManifest = JSON.parse(fs.readFileSync(path.join(root, 'data/manifest.json')));
const relevantMonths = ['2017-12', '2018-01', '2018-06', '2018-07', '2026-08', '2026-09'];
const manifest = { ...fullManifest, expectedMonths: relevantMonths, months: fullManifest.months.filter(meta => relevantMonths.includes(meta.month)) };
const cache = new Map();
async function loadCube(meta) {
  if (!cache.has(meta.month)) cache.set(meta.month, JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, 'data', meta.cubePath)))));
  return cache.get(meta.month);
}
async function snapshot(filters, sourceManifest = manifest) {
  const messages = [], port = { postMessage: message => messages.push(message) };
  workerContext.api.installMarketWorker(port, { loader: { load: loadCube, clear() {}, setNamespace() {}, stats() { return {}; } } });
  await port.onmessage({ data: { id: 1, manifest: sourceManifest, base: 'https://dashboard.example/data/', filters, includeChannelReference: true } });
  const terminal = messages.findLast(message => message.result || message.error);
  assert(terminal); assert(!terminal.error, terminal.error); return portable(terminal.result);
}
function oracle(cube, filters, range) {
  const cols = cube.columns ?? [...cube.dimensions, 'count'], index = Object.fromEntries(cols.map((name, i) => [name, i]));
  const result = new Map();
  for (const row of cube.rows) {
    const value = name => String(cube.dictionaries[name]?.[row[index[name]]] ?? 'Não informado');
    if (value('date') < range.start || value('date') > range.end) continue;
    if (filters.population === 'light' && !['Auto', 'Comercial Leve'].includes(value('segmento'))) continue;
    if (!Object.entries(filters).every(([name, selection]) => {
      if (['date', 'population', 'tipo_venda'].includes(name) || !selection || selection === 'all') return true;
      const values = Array.isArray(selection) ? selection : [selection];
      return !values.length || values.includes('all') || values.includes(value(name));
    })) continue;
    const uf = value('uf'), channel = value('tipo_venda'), count = row[index.count];
    if (!result.has(uf)) result.set(uf, { total: 0, retail: 0, direct: 0, unknown: 0 });
    const state = result.get(uf); state.total += count;
    state[channel === 'VAREJO' ? 'retail' : channel === 'VD' ? 'direct' : 'unknown'] += count;
  }
  return result;
}
function verifyOracle(data, expected) {
  for (const [uf, counts] of expected) {
    const row = data.rows.find(row => row.name === uf);
    assert.equal(row.total, counts.total, uf + ' total'); assert.equal(row.retailCount, counts.retail, uf + ' VAREJO'); assert.equal(row.directCount, counts.direct, uf + ' VD'); assert.equal(row.unknownCount, counts.unknown, uf + ' unknown');
    assert.equal(row.retailShare, counts.total ? counts.retail / counts.total : null); assert.equal(row.directShare, counts.total ? counts.direct / counts.total : null);
    if (counts.total) assert(Math.abs(row.retailShare + row.directShare + row.unknownShare - 1) < 1e-12);
  }
  assert.equal(data.summary.total, [...expected.values()].reduce((sum, counts) => sum + counts.total, 0));
}
const nodes = node => node && typeof node === 'object' ? [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] : [];
function render(model, filters = {}, scope = []) { cursor = 0; return api.TerritoryChannelMap({ model, filters, scope, onSelect: uf => drills.push(uf) }); }
let drills = [];
function mapPath(tree, uf) { return nodes(tree).find(node => node.type === 'path' && node.props['data-uf'] === uf); }
function details(tree) { return nodes(tree).find(node => node.type === api.TerritoryChannelDetails); }

(async () => {
  const filters = { date: '2026-09-01..2026-09-30', population: 'light' }, september = await loadCube(manifest.months.find(meta => meta.month === '2026-09'));
  const model = await snapshot(filters), data = api.territoryChannelAnalysis(model, filters, geometry.features);
  assert.equal(data.rows.length, 27); assert(data.complete); assert.equal(data.summary.total, 268721); assert.equal(data.summary.retailCount, 136656); assert.equal(data.summary.directCount, 132065); assert.equal(data.summary.unknownCount, 0);
  verifyOracle(data, oracle(september, filters, { start: '2026-09-01', end: '2026-09-30' }));
  for (const [uf, retail, direct] of [['BA', 6395, 2784], ['SP', 35830, 27879]]) {
    const row = data.rows.find(row => row.name === uf); assert.equal(row.retailCount, retail); assert.equal(row.directCount, direct); assert.equal(row.denominator, retail + direct);
  }
  const selectedChannel = await snapshot({ ...filters, tipo_venda: 'VD' });
  assert.equal(selectedChannel.total, 132065);
  assert.deepEqual(portable(api.territoryChannelAnalysis(selectedChannel, { ...filters, tipo_venda: 'VD' }, geometry.features).rows), portable(data.rows), 'Only channel is removed from the explicitly labeled composition reference');
  const selectedRetail = await snapshot({ ...filters, tipo_venda: 'VAREJO' });
  assert.equal(selectedRetail.total, 136656); assert.equal(selectedRetail.channelReference.total, 268721);
  for (const testFilters of [
    { ...filters, uf: 'BA', tipo_venda: 'VD' },
    { ...filters, uf: ['BA', 'SP'], marca: ['TOYOTA', 'MITSUBISHI'], combustivel: ['Gasolina', 'Álcool / Gasolina'] },
    { ...filters, segmento: 'Auto', bd_combustivel: ['BEV', 'HEV'], ano_fabricacao: '2026' },
    { ...filters, date: '2026-09-04..2026-09-15', uf: 'SP', municipio: 'SAO PAULO' },
    { ...filters, population: 'all_content' },
  ]) {
    const result = await snapshot(testFilters), analysis = api.territoryChannelAnalysis(result, testFilters, geometry.features), [start, end] = testFilters.date.split('..');
    verifyOracle(analysis, oracle(september, testFilters, { start, end }));
    assert(analysis.summary.total > 0, 'Real-source filter regression must exercise nonempty rows');
    if (testFilters.uf === 'BA') { const outside = analysis.rows.find(row => row.name === 'SP'); assert.equal(outside.total, null); assert.equal(outside.retailCount, null); assert.equal(outside.retailShare, null); assert.equal(outside.status, 'Fora do recorte geográfico'); }
  }
  const emptyFilters = { ...filters, marca: 'NO_TEST_DATA_BRAND' }, empty = api.territoryChannelAnalysis(await snapshot(emptyFilters), emptyFilters, geometry.features);
  assert.equal(empty.summary.total, 0); assert(empty.rows.every(row => row.total === 0 && row.retailCount === 0 && row.directCount === 0 && row.retailShare === null && row.status === 'Sem registros no recorte'));
  console.log('PASS: real September national/BA/SP counts, both channel selections, population/date/UF/municipality/brand/fuel filters, all-channel denominator and zero vs outside-scope distinction.');

  const historicalFilters = { date: '2017-12-01..2017-12-31', population: 'light', tipo_venda: 'VD' }, historicalModel = await snapshot(historicalFilters), historical = api.territoryChannelAnalysis(historicalModel, historicalFilters, geometry.features);
  assert.equal(historical.summary.total, 204852); assert.equal(historical.summary.unknownCount, 204852); assert.equal(historical.summary.retailCount, null); assert.equal(historical.summary.directCount, null); assert.equal(historical.summary.retailShare, null); assert(!historical.complete);
  const mixedFilters = { date: '2017-12-01..2018-01-31', population: 'light' }, mixed = api.territoryChannelAnalysis(await snapshot(mixedFilters), mixedFilters, geometry.features);
  assert.equal(mixed.summary.total, 380406); assert.equal(mixed.summary.retailCount, 117206); assert.equal(mixed.summary.directCount, 58348); assert.equal(mixed.summary.unknownCount, 204852); assert.equal(mixed.summary.retailShare, null); assert.equal(mixed.summary.directShare, null);
  const missingFilters = { date: '2026-08-01..2026-09-30', population: 'light' }, missingManifest = { ...manifest, months: manifest.months.filter(meta => meta.month !== '2026-08') };
  const missing = api.territoryChannelAnalysis(await snapshot(missingFilters, missingManifest), missingFilters, geometry.features);
  assert(!missing.complete); assert(missing.missingSourceMonths.includes('2026-08')); assert.equal(missing.summary.retailShare, null);
  const incompleteManifest = { ...manifest, months: manifest.months.map(meta => meta.month === '2026-09' ? { ...meta, sourceComplete: false } : meta) };
  const incomplete = api.territoryChannelAnalysis(await snapshot(filters, incompleteManifest), filters, geometry.features);
  assert(!incomplete.complete); assert(incomplete.missingSourceMonths.includes('2026-09')); assert.equal(incomplete.summary.directShare, null);
  console.log('PASS: 2017 unavailable source channels, mixed 2017/2018 partial channels, missing monthly file and incomplete source coverage never become 100% known-channel shares.');
  for (const month of ['2018-06', '2018-07']) {
    const meta = manifest.months.find(meta => meta.month === month), range = { start: month + '-01', end: month + (month === '2018-06' ? '-30' : '-31') };
    assert.deepEqual(meta.channelSourceFields, ['Vendas Diretas']); assert(meta.channelAliasRows > 0);
    const aliasFilters = { population: 'light', date: range.start + '..' + range.end }, cube = await loadCube(meta);
    assert.deepEqual(cube.dictionaries.tipo_venda, ['VAREJO', 'VD']);
    const alias = api.territoryChannelAnalysis(await snapshot(aliasFilters), aliasFilters, geometry.features);
    verifyOracle(alias, oracle(cube, aliasFilters, range)); assert(alias.complete);
  }
  console.log('PASS: both reviewed Vendas Diretas source-alias months preserve canonical VAREJO/VD mapping and reconcile by UF.');

  // Explicit edge-case fixtures are tests only, never production/dashboard data.
  const unknownModel = { channelReference: { total: 100, complete: true, monthly: [{ month: '2026-09', count: 100 }], channelCoverage: [{ month: '2026-09', available: true }], groups: { uf: [{ name: 'SP', count: 100 }] }, stateChannelsByMonth: [{ name: 'SP', channel: 'VAREJO', count: 70 }, { name: 'SP', channel: 'VD', count: 20 }, { name: 'SP', channel: 'UNRECOGNIZED', count: 10 }] } };
  const unknown = api.territoryChannelAnalysis(unknownModel, {}, geometry.features).rows.find(row => row.name === 'SP');
  assert.equal(unknown.retailShare, .7); assert.equal(unknown.directShare, .2); assert.equal(unknown.unknownShare, .1); assert.equal(unknown.unknownChannels, 'UNRECOGNIZED: 10');
  const corrupt = structuredClone(unknownModel); corrupt.channelReference.groups.uf[0].count = 110;
  assert.equal(api.territoryChannelAnalysis(corrupt, {}, geometry.features).rows.find(row => row.name === 'SP').retailShare, null, 'Unreconciled aggregates must not paint shares');
  const unknownUF = structuredClone(unknownModel); unknownUF.channelReference.groups.uf = [{ name: 'UF não informada', count: 100 }]; unknownUF.channelReference.stateChannelsByMonth = unknownUF.channelReference.stateChannelsByMonth.map(row => ({ ...row, name: 'UF não informada' }));
  assert.equal(api.territoryChannelAnalysis(unknownUF, {}, geometry.features).rows.length, 28, 'Unknown geography is kept in the list and total');

  let nonlinearCuts = 0;
  for (const feature of geometry.features) {
    const shape = api.territoryChannelGeometry(feature.path); assert(shape?.area > 0, feature.uf);
    const real = data.rows.find(row => row.name === feature.uf);
    for (const share of [0, .05, .25, .5, .7, .9, 1, real.retailShare]) {
      const cut = api.territoryAreaCut(shape, share), area = api.territoryAreaBefore(shape, shape.minX + cut * (shape.maxX - shape.minX));
      assert(Math.abs(area / shape.area - share) < 1e-7, `${feature.uf}: colored area ${area / shape.area} must equal source share ${share}`);
      if (Math.abs(cut - share) > .05) nonlinearCuts++;
    }
  }
  assert(nonlinearCuts > 30, 'Irregular state geometry must use area solving, not naive linear gradient width');
  const triangle = api.territoryChannelGeometry('M0,0 L100,0 L0,100 Z'); assert(Math.abs(api.territoryAreaCut(triangle, .5) - (1 - Math.sqrt(.5))) < 1e-8);
  console.log('PASS: actual polygon areas for all 27 UFs, islands, edge percentages, true triangular area cutoff, explicit unknown channel and unknown UF preservation.');

  slots = []; let tree = render(model, filters);
  assert.equal(nodes(tree).filter(node => node.type === 'path' && node.props['data-uf']).length, 27);
  assert.equal(details(tree).props.row.name, 'Recorte observado');
  mapPath(tree, 'BA').props.onMouseEnter(); tree = render(model, filters); assert.equal(details(tree).props.row.name, 'BA'); assert(details(tree).props.transient); assert.equal(details(tree).props.row.retailCount, 6395); assert.equal(mapPath(tree, 'BA').props['aria-pressed'], false);
  mapPath(tree, 'BA').props.onClick(); tree = render(model, filters); mapPath(tree, 'SP').props.onFocus(); tree = render(model, filters); assert.equal(details(tree).props.row.name, 'SP'); assert.equal(mapPath(tree, 'BA').props['aria-pressed'], true); assert.equal(mapPath(tree, 'SP').props['aria-pressed'], false);
  mapPath(tree, 'SP').props.onBlur(); tree = render(model, filters); assert.equal(details(tree).props.row.name, 'BA'); assert(!details(tree).props.transient);
  let prevented = false; mapPath(tree, 'SP').props.onKeyDown({ key: ' ', preventDefault() { prevented = true; } }); tree = render(model, filters); assert(prevented); assert.equal(details(tree).props.row.name, 'SP');
  nodes(tree).find(node => node.type === 'button' && node.props.children === 'Explorar SP ↗').props.onClick(); assert.deepEqual(drills, ['SP']);
  mapPath(tree, 'SP').props.onKeyDown({ key: 'Escape' }); tree = render(model, filters); assert.equal(details(tree).props.row.name, 'Recorte observado');
  mapPath(tree, 'BA').props.onKeyDown({ key: 'Enter', preventDefault() {} }); tree = render(model, filters); nodes(tree).find(node => node.type === 'button' && node.props.children === 'Limpar seleção').props.onClick(); tree = render(model, filters); assert(!nodes(tree).some(node => node.type === 'path' && node.props['aria-pressed']));
  assert(mapPath(tree, 'BA').props['aria-label'].includes('Varejo: 6.395')); assert(mapPath(tree, 'BA').props['aria-label'].includes('Não informado ou outros: 0'));
  const map = nodes(tree).find(node => node.props.id === 'territory-channel-map'), table = nodes(tree).find(node => node.props.id === 'territory-channel-table');
  assert.deepEqual(portable(map.props.sourceRows), portable(table.props.rows)); assert.deepEqual(portable(map.props.scopeFilters), portable(table.props.scope)); assert.equal(table.props.rows.length, 27);
  tree = render(selectedChannel, { ...filters, tipo_venda: 'VD' }, [{ field: 'tipo_venda', value: 'VD' }, { field: 'uf', value: 'all' }]);
  assert(nodes(tree).some(node => node.props.className === 'tc-scope' && JSON.stringify(node.props.children).includes('Canal selecionado acima: Venda Direta')));
  const selectedScope = nodes(tree).find(node => node.props.id === 'territory-channel-table').props.scope;
  assert.equal(selectedScope.filter(item => item.field === 'tipo_venda').length, 1); assert(selectedScope.find(item => item.field === 'tipo_venda').value.includes('Todos os canais'));
  tree = render(historicalModel, historicalFilters); assert.equal(mapPath(tree, 'SP').props.fill, 'url(#territory-channel-unavailable)'); assert(nodes(tree).some(node => node.props.className === 'tc-notice'));
  const detailTree = api.TerritoryChannelDetails({ row: data.rows.find(row => row.name === 'BA'), transient: true }); assert.equal(detailTree.props.role, 'tooltip'); assert.equal(nodes(detailTree).filter(node => node.type === 'dt').length, 3);
  console.log('PASS: accessible hover/focus, pinned click, Enter/Space/Escape, clear, drilldown, labels, explicit selected-channel disclosure, shared map/list scope and unavailable hatching.');
})().catch(error => { console.error(error); process.exitCode = 1; });
