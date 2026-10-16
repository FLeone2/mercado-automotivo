#!/usr/bin/env python3
"""Rebuild phases 1–3 from verified cached sources without changing original cubes."""
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PHASE_FILES=['phase1_sources.json','phase2_regional.json','phase23_models.json','phase3_hierarchy.json','phase3_spatial.json']
def run(script,*args):
 env=dict(os.environ);threads=env.get('SCENARIOS_BLAS_THREADS','1');env.update(OPENBLAS_NUM_THREADS=threads,OMP_NUM_THREADS=threads)
 subprocess.run([sys.executable,str(ROOT/'scripts'/script),*args],cwd=ROOT,env=env,check=True)
def manifest():
 p=ROOT/'data/scenarios/manifest.json';d=json.loads(p.read_text())
 for f in PHASE_FILES:
  if f not in d['files']:d['files'].append(f)
 d['phase123']={'publicSources':'phase1_sources.json','regionalMetrics':'phase2_regional.json','analyticalModels':'phase23_models.json','simulationEnabled':False,'historicalReleaseVintagesAvailable':False,'forecastUse':'experimental_reused_holdout; benchmark with measured error, not a validated commercial target','assetReceipts':[{'file':f,'sha256':hashlib.sha256((ROOT/'data/scenarios'/f).read_bytes()).hexdigest(),'bytes':(ROOT/'data/scenarios'/f).stat().st_size} for f in PHASE_FILES]}
 d['phase123']['hierarchy']='phase3_hierarchy.json'
 d['phase123']['spatialDiagnostics']='phase3_spatial.json'
 d['visuals']['reconciled_forecasts']={'tab':'Previsões','status':'experimental_reused_holdout','file':'phase3_hierarchy.json'}
 d['visuals']['spatial_residual_diagnostic']={'tab':'Potencial regional','status':'see_source_status','file':'phase3_spatial.json'}
 d['visuals']['public_source_coverage']={'tab':'Diagnóstico','status':'source_specific_availability','file':'phase1_sources.json'}
 d['visuals']['prewhitened_ccf']={'tab':'Economia e mercado','status':'exploratory_training_only','file':'phase23_models.json'}
 d['visuals']['geographic_ql']={'tab':'Potencial regional','status':'available_descriptive','file':'phase2_regional.json'}
 d['visuals']['rolling_horizon_backtest']={'tab':'Previsões','status':'experimental_reused_holdout','file':'phase23_models.json'}
 p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--integrate-only',action='store_true');args=parser.parse_args()
 if not args.integrate_only:
  run('phase1_sources.py');run('phase2_regional.py');run('phase23_models.py');run('phase3_hierarchy.py');run('phase3_spatial.py')
 manifest();run('build-scenarios.py')
