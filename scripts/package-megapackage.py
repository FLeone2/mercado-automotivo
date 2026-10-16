"""Create the cumulative overlay only after final test logs pass. Never publishes."""
from pathlib import Path
import argparse,subprocess,json,hashlib,zipfile,re
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--node-log',type=Path,required=True);p.add_argument('--python-log',type=Path,required=True);p.add_argument('--verified-main-at',required=True);p.add_argument('--verified-main-sha',required=True);args=p.parse_args()
base='9bbf173818d82207f5d3e66340ac1660953d3755'
assert args.verified_main_sha==base,'Remote changed: reconcile before packaging'
node=args.node_log.read_text();python=args.python_log.read_text();assert re.search(r'fail 0\b',node) and re.search(r'tests (\d+)',node),'Node suite must pass';assert re.search(r'Ran 101 tests',python) and re.search(r'\nOK\s*$',python),'Python suite must pass'
prior=json.loads((root/'MEGAPACOTE_MANIFEST.json').read_text()) if (root/'MEGAPACOTE_MANIFEST.json').exists() else {}
priorPaths={f['path'] for f in prior.get('files',[])}|({'MEGAPACOTE_MANIFEST.json'} if prior else set())
legacy=json.loads((root/'CATALOG_OVERLAY_MANIFEST.json').read_text());required={f['path'] for f in legacy['files']}|{'CATALOG_OVERLAY_MANIFEST.json'}
paths=set(subprocess.check_output(['git','ls-files','-m','-o','--exclude-standard'],cwd=root,text=True).splitlines())|required|priorPaths
paths=sorted(f for f in paths if '__pycache__' not in f and not f.endswith('.pyc') and f!='MEGAPACOTE_MANIFEST.json')
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=D'],cwd=root,text=True).strip()
assert required.issubset(paths) and len(required)==82
# The verified remote tree is available even when its commit object is not in this worktree.
baseTree=json.loads((root/'CATALOG_BASE_TREE.json').read_text());assert baseTree['sha']==legacy['baseTree']
sourceFiles=0
for entry in baseTree['tree']:
 f=entry['path']
 if entry['type']=='blob' and (f=='data/manifest.json' or f.startswith(('data/cubes/','data/origin-cubes/','data/geography/'))):
  data=(root/f).read_bytes();actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
  assert actual==entry['sha'],'Historical source data changed: '+f
  sourceFiles+=1
assert sourceFiles>=286,'Historical source tree inventory incomplete'
files=[]
for f in paths:
 path=root/f;assert path.is_file() and path.stat().st_size<25*1024*1024,f
 assert not f.startswith('/') and '..' not in Path(f).parts
 files.append({'path':f,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
manifest={'baseCommit':base,'baseTree':legacy['baseTree'],'verifiedMainAt':args.verified_main_at,'mode':'cumulative_overlay_no_deletions','supersedes':'all_previous_unpublished_overlays','previousOverlayFilesPreserved':len(required),'previousOverlayPaths':sorted(required),'previousMegaPackagePathsPreserved':len(priorPaths),'previousMegaPackagePaths':sorted(priorPaths),'performanceStage1':{'sharedSessionWorkers':True,'reusableMonthlyAggregates':True,'boundedVersionedIndexedDB':True,'retainedChartsWhileUpdating':True,'serverInfrastructure':False,'instantFirstLoadGuaranteed':False},'primaryNavigationAreas':8,'animationViews':['races','bubbles','mix','maps'],'evolutionAdditionalPanels':'Executiva only: interval brush and annual curves','pickupRule':'bd_segmento exactly PICK-UP MID; intersects all other filters','chartFormatsPreserved':13,'mapFormatsPreserved':7,'themes':{'requested':14,'legacy':5,'total':19},'history':{'months':129,'allSourceRegistrations':24556119,'lightRegistrations':24541931,'heavyRecordsInAugust2024':14188,'sourceDataUnchanged':True},'tests':{'nodeCases':int(re.search(r'tests (\d+)',node)[1]),'nodeFiles':len(list((root/'tests').glob('*.test.cjs'))),'pythonCases':101},'browserVisualQA':'not_run_restricted_environment; automated source/data/lifecycle tests are not pixel validation','simulationPhase4Activated':False,'newTargetsFeature':False,'files':files}
manifestPath=root/'MEGAPACOTE_MANIFEST.json';manifestPath.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');paths.append(manifestPath.name)
out=root.parent/'mercado-megapacote-otimizado-etapa1.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in paths:z.write(root/f,f)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert required.issubset(z.namelist())
 assert priorPaths.issubset(z.namelist())
 for f in files:assert hashlib.sha256(z.read(f['path'])).hexdigest()==f['sha256']
print(json.dumps({'path':str(out),'files':len(paths),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'previousOverlayFilesPreserved':len(required),'maxAsset':max(files,key=lambda f:f['bytes']),'tests':manifest['tests']},ensure_ascii=False))
