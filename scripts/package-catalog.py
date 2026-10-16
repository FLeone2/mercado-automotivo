"""Package all cumulative changes relative to the verified baseline, no deletions."""
from pathlib import Path
import subprocess,json,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
paths=subprocess.check_output(['git','ls-files','-m','-o','--exclude-standard'],cwd=root,text=True).splitlines()
paths=sorted(set(p for p in paths if '__pycache__' not in p and not p.endswith('.pyc') and p!='CATALOG_OVERLAY_MANIFEST.json'))
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=D'],cwd=root,text=True).strip()
for p in paths:
 assert (root/p).is_file(),p
 assert (root/p).stat().st_size<25*1024*1024,p
files=[{'path':p,'bytes':(root/p).stat().st_size,'sha256':hashlib.sha256((root/p).read_bytes()).hexdigest()} for p in paths]
manifest={'baseCommit':'9bbf173818d82207f5d3e66340ac1660953d3755','baseTree':'890f2f877567fe770b327549e1535f447cd5794d','verifiedBaseFiles':349,'mode':'cumulative_overlay_no_deletions','supersedes':'all_previous_unpublished_overlays_including_catalog_and_phases_1_3','primaryMaps':['Panorama','Territórios'],'primaryMapCityAction':'details_then_explicit_filter_button','verifiedMainAt':'2026-10-16T01:20:00Z','chartFormats':13,'mapFormats':7,'populationRate':{'year':2026,'municipalities':5571,'population':214211951,'annualized':False},'flowMapIncluded':False,'requestedThemes':14,'totalThemesIncludingLegacy':19,'nodeTestFiles':len(list((root/'tests').glob('*.test.cjs'))),'pythonTests':101,'browserVisualQA':'not_run_restricted_environment','files':files}
(root/'CATALOG_OVERLAY_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
paths.append('CATALOG_OVERLAY_MANIFEST.json');out=root.parent/'mercado-atualizacao-completa-mapas-principais-e-pendencias.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in paths:z.write(root/p,p)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for r in files:assert hashlib.sha256(z.read(r['path'])).hexdigest()==r['sha256']
print(json.dumps({'path':str(out),'files':len(paths),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'largestAsset':max(files,key=lambda f:f['bytes'])},ensure_ascii=False))
