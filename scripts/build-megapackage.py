"""Rebuild additive end-of-day features in deterministic order; never publishes."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for script in ['build-catalog.py','build-primary-map.py','build-interactive.py','build-animations.py','build-performance.py','build-municipal-fixes.py','build-competition-fixes.py','build-page-notes.py']:
 subprocess.run([sys.executable,str(root/'scripts'/script)],cwd=root,check=True)
