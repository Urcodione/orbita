#!/usr/bin/env python3
"""Build a signed, offline Android test APK without bundling any saves or QA files."""
from pathlib import Path
import argparse, os, shutil, subprocess, zipfile, hashlib, json, xml.etree.ElementTree as ET
p=argparse.ArgumentParser()
p.add_argument('--toolchain',type=Path,default=Path('/tmp/orbita-android-toolchain'))
a=p.parse_args()
root=Path(__file__).resolve().parent
game=root.parent
manifest=ET.parse(root/'AndroidManifest.xml').getroot()
version=manifest.attrib['{http://schemas.android.com/apk/res/android}versionName']
tools=a.toolchain.resolve()
jdk=next(tools.glob('jdk-*/bin/java')).parent.parent
bt=next(tools.glob('*/aapt2')).parent
platform=next(tools.glob('*/android.jar'))
env={**os.environ,'JAVA_HOME':str(jdk),'PATH':str(jdk/'bin')+os.pathsep+os.environ['PATH']}
def run(*args):subprocess.run([str(v) for v in args],check=True,env=env)
run('python3',game/'build.py')
build=root/'build'
if build.exists():shutil.rmtree(build)
for d in ['assets','classes','dex']:(build/d).mkdir(parents=True)
html=(game/'index.html').read_text()
# Explicit allowlist: only the full offline game is packaged. No QA, fixtures or saved sessions.
html=html.replace('<head>','<head><script>window.OrbitAndroid=true;</script>',1)
(build/'assets/index.html').write_text(html)
run(bt/'aapt2','compile','--dir',root/'res','-o',build/'resources.zip')
run(bt/'aapt2','link','-I',platform,'--manifest',root/'AndroidManifest.xml','-A',build/'assets','-o',build/'unsigned.apk',build/'resources.zip')
run(jdk/'bin/javac','-encoding','UTF-8','--release','8','-classpath',platform,'-d',build/'classes',*sorted((root/'src').rglob('*.java')))
run(bt/'d8','--lib',platform,'--min-api','26','--output',build/'dex',*sorted((build/'classes').rglob('*.class')))
with zipfile.ZipFile(build/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
 for dex in (build/'dex').glob('*.dex'):z.write(dex,dex.name)
run(bt/'zipalign','-f','4',build/'unsigned.apk',build/'aligned.apk')
private=root/'.private';private.mkdir(exist_ok=True);private.chmod(0o700)
key=private/'orbita-test.jks'
if not key.exists():
 run(jdk/'bin/keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','orbita-test','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Orbita Local Testing, O=Space Explorer, C=BR')
 key.chmod(0o600)
out=root/('dist/orbita-'+version+'.apk');out.parent.mkdir(exist_ok=True)
run(bt/'apksigner','sign','--ks',key,'--ks-key-alias','orbita-test','--ks-pass','pass:android','--key-pass','pass:android','--out',out,build/'aligned.apk')
run(bt/'apksigner','verify','--verbose',out)
with zipfile.ZipFile(out) as z:
 assets=[n for n in z.namelist() if n.startswith('assets/')]
 assert assets==['assets/index.html'],assets
 assert z.read(assets[0]).decode()==html
summary={'apk':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'assets':assets,'minAndroid':'8.0','version':version,'bundledSave':False,'networkPermission':False}
(out.parent/'build-report.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
