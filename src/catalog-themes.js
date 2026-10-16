/* Theme extension for the existing Data app picker. Embed before its first use,
   then call installCatalogThemes(T5, C5). No new storage or UI is introduced. */
var CATALOG_THEME_FONT = '"Segoe UI", SegoeUI, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
var CATALOG_REQUESTED_THEME_IDS = ['original', 'liquid-blue', 'aqua-clean', 'sage', 'sand', 'night-blue', 'lavender', 'graphite', 'olive', 'earth', 'vista-aurora', 'windows-xp', 'windows-95', 'blue-glass'];
var CATALOG_THEME_PALETTES = [
  // id, label, light background/surface/muted/text/secondary/border/accent,
  // dark background/surface/muted/text/secondary/border/accent.
  ['aqua-clean', 'Aqua Clean', ['#edfaff','#f8fdff','#dceff5','#153747','#405d6b','#adc9d5','#006c83'], ['#10252d','#18323c','#244550','#effaff','#b8d3dd','#577681','#69d5ed']],
  ['sage', 'Sálvia', ['#edf3ed','#f9fcf8','#e0eadd','#263d2a','#4b604e','#b9cbb6','#386b43'], ['#18251c','#23352a','#304637','#f0f8ee','#c0d3bd','#658069','#a0d7a4']],
  ['sand', 'Areia', ['#f5f0e7','#fffcf7','#ebe2d2','#413629','#665846','#d0c1a9','#80551f'], ['#29231b','#393025','#493e30','#fff7e8','#d9cbb4','#8e7b60','#ebc48b']],
  ['night-blue', 'Azul Noturno', ['#e9eef7','#f7faff','#dce5f4','#1d2b49','#4c5c78','#acbdd8','#244f98'], ['#101a30','#182641','#243650','#f0f5ff','#becce6','#627796','#9fc1ff']],
  ['lavender', 'Lavanda', ['#f2eef9','#fcfaff','#e8e1f3','#392b4c','#655274','#c9bbd9','#704795'], ['#241b30','#31263f','#41334f','#faf2ff','#d5c2e6','#857196','#d4b0f0']],
  ['graphite', 'Grafite', ['#ededf0','#fafafa','#e0e2e6','#292e38','#555c68','#bbc0c8','#435a78'], ['#1a1e25','#272d36','#363e49','#f5f7fc','#c7cdd8','#788391','#b4c9e6']],
  ['olive', 'Verde Oliva', ['#f0f1e5','#fbfcf6','#e5e8d4','#343b24','#576044','#c1c8a6','#596c29'], ['#22271a','#303824','#404b31','#f6f9e9','#cbd6b2','#7f8d63','#c2d58d']],
  ['earth', 'Marrom Terra', ['#f5ece6','#fffaf6','#eddfd4','#483025','#705343','#d7bda9','#8a492b'], ['#2d211b','#3e2d24','#503b2f','#fff3e9','#e0c2ac','#98735a','#edb18b']],
  ['vista-aurora', 'Vista Aurora', ['#e6f5f5','#f5fcff','#d7ebed','#123b44','#3f6069','#a7c9d0','#006f80'], ['#10262f','#173844','#234a55','#effcff','#b8d9e1','#59848c','#6cdbdc']],
  ['windows-xp', 'Windows XP', ['#e9eff8','#fffdf4','#dce7f6','#17366a','#485c79','#9eb7d8','#1855b1'], ['#13233d','#1d3454','#294969','#f3f7ff','#c4d5ec','#688bab','#9bc9ff']],
  ['windows-95', 'Windows 95', ['#d7dddd','#e9e9e9','#c9d0d0','#151b26','#394451','#8a959b','#000080'], ['#202b2b','#303a3a','#414d4d','#f8fafa','#d0dddd','#859595','#a9c8ff']],
  ['blue-glass', 'Vidro Azul', ['#e6f1fc','#f7fbff','#d9e9fa','#163c60','#45617a','#adc7e0','#175a9f'], ['#132639','#1b354d','#294a65','#f0f8ff','#bed6ec','#6586a3','#98ceff']]
];
function catalogThemeTokens(palette, dark, keys) {
  var [background, surface, muted, text, secondary, border, accent] = palette;
  var semantic = dark ? ['#40c977','#ff6764','#5bd3ac','#91b4ef','#77d6cc','#e5b76e','#d1a9eb','#a3bde0','#ff6764','#afafaf'] : ['#168043','#e02e2a','#00815f','#4278c7','#20877f','#b47c31','#956bb9','#7990af','#fa423e','#8f8f8f'];
  var tokens = {background, surface, 'surface-raised': surface, muted, control: surface, 'control-hover': muted, text, secondary, border, 'border-strong': secondary, accent,
    positive: semantic[0], negative: semantic[1], 'card-radius': '16px', 'control-radius': '12px', 'mark-radius': '8',
    'card-shadow': dark ? '0 8px 30px rgb(0 0 0 / 22%), inset 0 1px 0 rgb(255 255 255 / 9%)' : '0 8px 30px rgb(20 40 60 / 7%), inset 0 1px 0 rgb(255 255 255 / 88%)',
    shadow: dark ? '0 8px 24px rgb(0 0 0 / 32%)' : '0 8px 24px rgb(20 40 60 / 12%)', 'font-sans': CATALOG_THEME_FONT};
  semantic.slice(2).forEach(function (color, i) { tokens['chart-' + (i + 1)] = color; });
  return keys.map(function (key) { return tokens[key]; });
}
function installCatalogThemes(registry, keys) {
  var fontIndex = keys.indexOf('font-sans');
  // IDs remain unchanged: stored choices, favorites and the original default survive.
  registry.forEach(function (theme) {
    if (theme.id === 'original') theme.label = 'Verde profundo';
    if (theme.id === 'liquid-blue') theme.label = 'Azul #3487FF';
    ['tokens', 'darkTokens'].forEach(function (name) {
      if (theme[name] && fontIndex >= 0) theme[name][fontIndex] = CATALOG_THEME_FONT;
    });
  });
  CATALOG_THEME_PALETTES.forEach(function (entry) {
    if (!registry.some(function (theme) { return theme.id === entry[0]; })) {
      registry.push({id: entry[0], label: entry[1], tokens: catalogThemeTokens(entry[2], false, keys), darkTokens: catalogThemeTokens(entry[3], true, keys)});
    }
  });
  return registry;
}
if (typeof module !== 'undefined' && module.exports) module.exports = {installCatalogThemes, catalogThemeTokens, CATALOG_THEME_FONT, CATALOG_REQUESTED_THEME_IDS, CATALOG_THEME_PALETTES};
