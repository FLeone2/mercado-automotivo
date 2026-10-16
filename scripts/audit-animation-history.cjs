#!/usr/bin/env node
/*
 * Reproducible full-history audit of the reviewed monthly registration cubes.
 * Run from any working directory with Node.js; only built-in modules are used.
 * Every gzip is read sequentially. Counts are weighted registrations, not compact rows.
 * No source files are modified. --report optionally writes the detailed audit results.
 * Full-history checks can use several hundred MB of memory on a desktop computer.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('Usage: node scripts/audit-animation-history.cjs [--report path.json]\nReads all monthly origin cubes, verifies weighted counts and comparisons, and prints a short summary.');process.exit(0);}
let reportPath=null;
if(args.length){if(args.length!==2||args[0]!=='--report'){console.error('Usage: node scripts/audit-animation-history.cjs [--report path.json]');process.exit(2);}reportPath=path.resolve(args[1]);}
const A=require(path.join(root,'src/animations-data.js')),W=require(path.join(root,'src/animations-worker.js'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json')));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),anchor=html.indexOf('const jsonValue0 = value["brands"]'),start=html.lastIndexOf('JSON.parse(',anchor),end=html.indexOf(');',start),originMapping=JSON.parse(JSON.parse(html.slice(start+11,end)));
const sum=rows=>rows.reduce((s,r)=>s+r.count,0),ss=(rows,key)=>rows.reduce((s,r)=>s+(r[key]??0),0);
const report={source:'All actual origin-cubes sequentially gunzipped and passed through actual aggregateCube',modules:{data:fs.statSync(path.join(root,'src/animations-data.js')).mtime.toISOString(),worker:fs.statSync(path.join(root,'src/animations-worker.js')).mtime.toISOString()},months:[],failures:[],full:{registrations:0,sourceRows:0,mit:0,midPickup:0,midPickupMit:0,otherPickups:0,channelKnown:0,channelUnknown:0,technology:{},origins:{}},filters:{brandMitRegistrations:0,ufSPMidSUV:0},coverage:{complete:0,partial:0,missing:0},yoy:{monthsComparable:0,monthsUnavailable:0},ytd:{monthsComplete:0,yearEnd:[]}};
function check(v,msg){if(!v){report.failures.push(msg);console.error('FAIL:',msg);}}
const frames=[],rawByMonth=new Map();
for(let i=0;i<manifest.months.length;i++){
 const meta=manifest.months[i],cube=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data',meta.originCubePath))));
 W.validateMonthlyCube(cube,meta);
 const idx=Object.fromEntries(cube.columns.map((k,i)=>[k,i])),dec=(r,k)=>cube.dictionaries[k]?.[r[idx[k]]];
 let rawTotal=0,rawMit=0,rawMid=0,rawMidMit=0,rawOtherPickup=0,rawKnown=0,rawSP=0,rawSPMit=0,rawFiltered=0;
 const rawTech={},rawOrigins={};
 for(const r of cube.rows){const n=r[idx.count],brand=dec(r,'marca'),bdSeg=dec(r,'bd_segmento');rawTotal+=n;if(brand==='MITSUBISHI')rawMit+=n;if(bdSeg==='PICK-UP MID'){rawMid+=n;if(brand==='MITSUBISHI')rawMidMit+=n;}else if(String(bdSeg).startsWith('PICK-UP'))rawOtherPickup+=n;if(['VD','VAREJO'].includes(dec(r,'tipo_venda')))rawKnown+=n;if(dec(r,'uf')==='SP'){rawSP+=n;if(brand==='MITSUBISHI')rawSPMit+=n;if(dec(r,'bd_carroceria')==='SUV'&&bdSeg==='MID'&&['Auto','Comercial Leve'].includes(dec(r,'segmento')))rawFiltered+=n;}
  const t=A.propulsion(dec(r,'bd_combustivel'));rawTech[t]=(rawTech[t]??0)+n;
  const o=A.classifyBrandOrigin(brand,+meta.month.slice(0,4),originMapping);rawOrigins[o.name]=(rawOrigins[o.name]??0)+n;
 }
 const req={filters:{},dimension:'marca',selectedUF:'SP',originMapping},f=A.aggregateCube(cube,meta,req),p=A.aggregateCube(cube,meta,{...req,selectedUF:'',preset:'midsize-pickups'}),mit=A.aggregateCube(cube,meta,{...req,selectedUF:'',filters:{marca:['MITSUBISHI']}}),filtered=A.aggregateCube(cube,meta,{...req,selectedUF:'',filters:{population:'light',uf:['SP']},preset:'suv',porte:['MID']});
 check(rawTotal===meta.eligibleRows,`${meta.month} raw versus eligible ${rawTotal} != ${meta.eligibleRows}`);check(f.total===rawTotal,`${meta.month} total`);check(f.complete,`${meta.month} completeness`);
 for(const dim of A.GROUP_DIMS){check(sum(f.groups[dim])===rawTotal,`${meta.month} ${dim} sum`);check(Math.abs(ss(f.groups[dim],'share')-1)<1e-10,`${meta.month} ${dim} share`);check(ss(f.groups[dim],'mitCount')===rawMit,`${meta.month} ${dim} MIT`);for(const r of f.groups[dim]){check(Object.values(r.brands).reduce((a,b)=>a+b,0)===r.count,`${meta.month} ${dim} ${r.name} brands`);check(Object.values(r.technologyCounts).reduce((a,b)=>a+b,0)===r.count,`${meta.month} ${dim} ${r.name} technologies`);}}
 check(sum(f.originRows)===rawTotal,`${meta.month} origin conservation`);check(sum(f.ufRows)===rawTotal,`${meta.month} UF conservation`);check(sum(f.municipalityRows)===rawSP,`${meta.month} SP municipality conservation`);check(ss(f.municipalityRows,'mitCount')===rawSPMit,`${meta.month} SP municipality MIT`);
 check(p.total===rawMid,`${meta.month} pickup exact`);check(p.groups.bd_segmento.every(r=>r.name==='PICK-UP MID'),`${meta.month} pickup excluded category`);check(ss(p.groups.marca,'mitCount')===rawMidMit,`${meta.month} pickup MIT`);
 check(mit.total===rawMit,`${meta.month} MIT filter exact`);check(filtered.total===rawFiltered,`${meta.month} SP + light + SUV + MID intersection`);
 check(f.channelCoverage.knownCount===rawKnown,`${meta.month} channel known`);check(f.channelCoverage.unknownCount===rawTotal-rawKnown,`${meta.month} channel unknown`);check(f.channelCoverage.knownCount+f.channelCoverage.unknownCount===f.total,`${meta.month} channel conservation`);
 for(const r of f.groups.propulsao)check(r.count===rawTech[r.name],`${meta.month} technology ${r.name}`);for(const r of f.originRows){check(r.count===rawOrigins[r.name],`${meta.month} origin ${r.name}`);check(r.kind==='unknown'||r.sourceUrls.length>0,`${meta.month} origin sources ${r.name}`);}
 const cov=A.sourceCoverage(meta,meta.month);report.coverage[cov.status]=(report.coverage[cov.status]??0)+1;
 if(!meta.channelSourceFields.length){const channelFiltered=A.aggregateCube(cube,meta,{...req,selectedUF:'',filters:{tipo_venda:['VD']}});check(channelFiltered.total===null&&channelFiltered.coverageStatus==='unavailable',`${meta.month} absent channel must unavailable`);}
 const month={month:meta.month,registrations:rawTotal,cubeRows:cube.rows.length,mit:rawMit,midPickup:rawMid,midPickupMit:rawMidMit,otherPickups:rawOtherPickup,channelKnown:rawKnown,channelUnknown:rawTotal-rawKnown,sourceFields:meta.channelSourceFields,scopeKey:f.scopeKey,spRegistrations:rawSP,spMit:rawSPMit,spMidSUV:rawFiltered,technologies:rawTech,origins:rawOrigins};report.months.push(month);rawByMonth.set(meta.month,month);
 for(const key of ['registrations','mit','midPickup','midPickupMit','otherPickups','channelKnown','channelUnknown'])report.full[key]+=month[key];report.full.sourceRows+=cube.rows.length;
 for(const [k,v] of Object.entries(rawTech))report.full.technology[k]=(report.full.technology[k]??0)+v;for(const [k,v] of Object.entries(rawOrigins))report.full.origins[k]=(report.full.origins[k]??0)+v;
 report.filters.brandMitRegistrations+=mit.total;report.filters.ufSPMidSUV+=filtered.total;
 // Retain compact complete groups for full-history YTD/YoY, without redundant municipal arrays.
 frames.push({...f,municipalityRows:[]});

}
check(report.full.registrations===24556119,'Full history expected 24556119');check(report.full.registrations===manifest.totals.eligible_rows,'Full manifest total');
const yoy=A.attachYoY(frames),ytd=A.yearToDateFrames(frames),ytdyoy=A.attachYoY(ytd);
for(const f of yoy){const prev=rawByMonth.get(A.priorMonth(f.month)),raw=rawByMonth.get(f.month),comparable=prev&&prev.scopeKey===raw.scopeKey;check(f.yearAvailable===!!comparable,`${f.month} YoY availability scope`);if(comparable){report.yoy.monthsComparable++;check(f.priorTotal===prev.registrations,`${f.month} prior total`);check(Math.abs(f.yoy-(raw.registrations-prev.registrations)/prev.registrations)<1e-12,`${f.month} YoY value`);const mit=f.groups.marca.find(r=>r.name==='MITSUBISHI');check(mit.priorCount===prev.mit,`${f.month} MIT prior`);check(Math.abs(mit.yoy-(raw.mit-prev.mit)/prev.mit)<1e-12,`${f.month} MIT YoY`);}else{report.yoy.monthsUnavailable++;check(f.yoy===null,`${f.month} unavailable YoY`);}}
for(const f of ytd){const raw=report.months.filter(m=>m.month.slice(0,4)===f.month.slice(0,4)&&m.month<=f.month),sameScope=new Set(raw.map(m=>m.scopeKey)).size===1,expected=raw.reduce((a,m)=>a+m.registrations,0),expectedMit=raw.reduce((a,m)=>a+m.mit,0);check(f.complete===sameScope,`${f.month} YTD scope availability`);check(f.observedTotal===expected,`${f.month} YTD observed total`);if(sameScope){report.ytd.monthsComplete++;check(f.total===expected,`${f.month} YTD total`);check(f.groups.marca.find(r=>r.name==='MITSUBISHI').count===expectedMit,`${f.month} YTD MIT`);for(const dim of A.GROUP_DIMS)check(sum(f.groups[dim])===f.total,`${f.month} YTD ${dim} conservation`);}if(f.month.endsWith('-12')||f.month===manifest.months.at(-1).month)report.ytd.yearEnd.push({month:f.month,total:f.total,mit:expectedMit,status:f.coverageStatus});}
report.scopeKeys=[...new Set(frames.map(f=>f.scopeKey))];report.originMappingSummary={version:originMapping.version,brands:Object.keys(originMapping.brands??{}).length,statuses:[...new Set(Object.values(originMapping.brands??{}).map(r=>r.status))]};
report.ytd.yoyComparableMonths=ytdyoy.filter(frame=>frame.yearAvailable).length;
for(const frame of ytdyoy){
 const previous=ytd.find(candidate=>candidate.month===A.priorMonth(frame.month));
 const comparable=Boolean(frame.complete&&previous?.complete&&frame.scopeKey===previous.scopeKey);
 check(frame.yearAvailable===comparable,frame.month+' YTD YoY availability');
 if(comparable)check(frame.yoy===(frame.total-previous.total)/previous.total,frame.month+' YTD YoY value');
}
report.pass=report.failures.length===0;
report.completed=new Date().toISOString();
report.limitations=['Origin labels were checked against the bundled source-linked mapping; this script does not independently revalidate external source websites.','The full-source population includes heavy vehicles in August 2024. Comparisons across that scope change must remain unavailable.'];
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,months:report.months.length,weightedRegistrations:report.full.registrations,compactRows:report.full.sourceRows,mitsubishi:report.full.mit,exactMidsizePickups:report.full.midPickup,midsizeMitsubishi:report.full.midPickupMit,excludedOtherPickups:report.full.otherPickups,unknownChannel:report.full.channelUnknown,completeMonths:report.coverage.complete,monthlyYoYComparable:report.yoy.monthsComparable,completeYTDMonths:report.ytd.monthsComplete,ytdYoYComparable:report.ytd.yoyComparableMonths,failures:report.failures.length,...(reportPath?{reportWritten:reportPath}:{})},null,2));
if(!report.pass)process.exitCode=1;

