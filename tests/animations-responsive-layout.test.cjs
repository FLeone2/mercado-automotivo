'use strict';
// Source/JSX geometry regression, not a browser screenshot test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src/animations-charts.css'),'utf8');
const workspace=fs.readFileSync(path.join(root,'src/animations.css'),'utf8');
const rules=(source,selector)=>source.slice(source.indexOf(selector+'{')+selector.length+1).split('}')[0];
assert(rules(workspace,'.animations-workspace').includes('grid-template-columns:minmax(0,1fr)'), 'The workspace track must shrink below the leadership ribbon min-content width.');
assert(workspace.includes('.animations-workspace>*,.animations-workspace>[data-chart-stale]>div{min-width:0;max-width:100%}'), 'Both snapshot wrapper levels stay bounded.');
assert(rules(css,'.ac-race-canvas').includes('width:100%;min-width:0;container-type:inline-size;container-name:animation-race'), 'Race geometry follows its own container, including sidebar/zoom changes.');
assert(!rules(css,'.ac-race-canvas').includes('min-width:660px'));
assert(rules(css,'.ac-race-row').includes('grid-template-columns:minmax(0,min(25%,220px)) minmax(0,1fr) 116px'));
assert(css.includes('@container animation-race (max-width:560px)'));
assert(css.includes('.ac-race-track{grid-column:1 / -1;grid-row:2;height:17px}'));
assert(css.includes('.ac-race-value{grid-column:2;grid-row:1;flex-direction:row;'));
assert(rules(workspace,'.animations-heading p').includes('color:var(--secondary)'));
assert(rules(workspace,'.animations-context').includes('color:var(--secondary)'));

const C=require('../src/animations-charts.js');
global.React={useMemo:fn=>fn()};
global.jsxRuntime={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
const walk=n=>n&&typeof n==='object'?[n,...[n.props?.children].flat(Infinity).flatMap(walk)]:[];
const frames=Array.from({length:24},(_,i)=>{
 const entities=Array.from({length:25},(_,j)=>({name:j===24?'MITSUBISHI':'LONG ENTITY NAME '+j,count:(j+1)*(i+1)*12345,mitCount:j===24?(j+1)*(i+1)*12345:0}));
 const total=entities.reduce((s,r)=>s+r.count,0);return {month:`${2024+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,complete:true,total,groups:{marca:entities}};
});
for(const metric of ['count','share','mitCount']){
 const options={topN:10,pinMIT:true,metric},pool=C.animationRacePool(frames,'marca',options);
 for(const frame of frames){
  const tree=walk(C.AnimationRace({frames,frame,...options}));
  const rows=tree.filter(n=>n.props?.className?.startsWith('ac-race-row')&&n.props.style.opacity===1);
  const ranked=C.animationRankRows(frame,'marca',options).display;
  for(const row of rows){
   const source=ranked.find(r=>r.name===row.props['data-entity']);
   const bar=walk(row).find(n=>n.props?.className==='ac-race-bar');
   const percent=parseFloat(bar.props.style.width);
   assert.equal(percent,source.value/pool.max*100,'Fixed domain is unchanged; no clipping or rescaling by current frame.');
   assert(percent>=0&&percent<=100);
   assert(walk(row).some(n=>n.props?.className==='ac-race-value'),'Values remain present even on narrow layouts.');
   // Algebraic bounds for the exact declared grid tracks; rendered pixels require browser QA.
   for(const width of [240,288,320,375,560,561,768,1024,1440,1920]){
    const compact=width<=560,name=compact?0:Math.min(width*.25,220),track=compact?width:width-name-116-28;
    const left=compact?0:name+14,end=left+track*percent/100;
    assert(track>0&&end<=width,'Every proportional bar remains within the available canvas.');
    if(!compact)assert.equal(left+track+14+116,width,'Numeric values retain reserved width.');
   }
  }
 }
}
console.log('PASS animation responsive source/JSX regression: bounded grid + snapshot wrappers, container-responsive rows, unchanged fixed domains over 24 frames / 3 metrics / 10 widths, exact values retained, theme text contrast. Browser pixel QA remains separate.');
