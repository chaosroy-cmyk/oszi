#!/usr/bin/env python3
"""Build a complete source + public-dist ZIP, with internal SHA-256 manifest."""
import hashlib
import json
import pathlib
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
version = json.loads((root/'package.json').read_text())['version']
release = version[:-2] if version.endswith('.0') else version
folder = f'kfz-oszi-v{release}'
output = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else root.parent/f'artifacts/{folder}.zip').resolve()
if f'Stand v{release} (' not in (root/'index.html').read_text() or f"'v{release}'" not in (root/'service-worker.js').read_text():
    raise SystemExit('App/worker version mismatch')
if not (root/'dist/index.html').exists() or (root/'dist/index.html').read_bytes() != (root/'index.html').read_bytes():
    raise SystemExit('Run bash build-dist.sh first')
excluded = {'.git','node_modules','__pycache__','.venv','.pytest_cache','.npm'}
root_files = {'index.html','manifest.webmanifest','service-worker.js','sw.js','_headers',
              '.gitignore','package.json','package-lock.json','requirements.txt','bridge.py',
              'bridge_protocol.py','build-dist.sh','start-live.cmd','stop-live.cmd',
              'README.md','DEPLOY.md','CHANGELOG.md','README-LIVE.txt','README-INSTALLATION.txt',
              'README_STARTPROBLEM.txt','COPYRIGHT_ROY_SPERLICH.txt','EIGENTUEMER_SIGNATUR.txt','PROMPT_V10.md'}
source_dirs = {'icons','multimeter','tools','tests','docs','dist','.github'}
source_suffixes = {'.html','.webmanifest','.js','.cjs','.py','.sh','.cmd','.md','.txt','.json','.png','.svg','.yml','.yaml'}
files=[]
for file in sorted(root.rglob('*')):
    rel=file.relative_to(root)
    if any(part in excluded for part in rel.parts) or file.is_symlink() or not file.is_file():
        continue
    if file.suffix in ('.zip','.pyc','.log') or file.name in ('.DS_Store','SHA256SUMS') or file==output:
        continue
    if len(rel.parts)==1:
        if file.name not in root_files:continue
    elif rel.parts[0] not in source_dirs or (file.suffix not in source_suffixes and file.name!='_headers'):
        continue
    if file.name.startswith('.env') or file.name in ('.npmrc','.pypirc'):
        continue
    files.append((rel.as_posix(),file.read_bytes()))
manifest=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in files)
output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for name,data in files+[('SHA256SUMS',manifest.encode())]:
        info=zipfile.ZipInfo(folder+'/'+name,date_time=(2026,10,26,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        info.external_attr=(0o100644<<16)
        archive.writestr(info,data)
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for line in archive.read(folder+'/SHA256SUMS').decode().splitlines():
        digest,name=line.split('  ',1)
        assert hashlib.sha256(archive.read(folder+'/'+name)).hexdigest()==digest
checksum=hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix+'.sha256').write_text(checksum+'  '+output.name+'\n')
print(f'{output}: {len(files)+1} files, {output.stat().st_size} bytes; integrity verified')
print('SHA256 '+checksum)
