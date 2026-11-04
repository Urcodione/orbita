#!/usr/bin/env python3
"""Package the offline game for Android without bundling any saves or QA files.

Default: a test APK signed with the local test key (installs over earlier test versions).
--bundle: the Android App Bundle (.aab) for Google Play, signed with the upload key.
"""
from pathlib import Path
import argparse, os, getpass, shutil, subprocess, zipfile, hashlib, json, xml.etree.ElementTree as ET
p=argparse.ArgumentParser()
p.add_argument('--toolchain',type=Path,default=Path('/tmp/orbita-android-toolchain'))
p.add_argument('--bundle',action='store_true',help='Build the signed .aab for Google Play instead of the test APK.')
a=p.parse_args()
root=Path(__file__).resolve().parent
game=root.parent
NS='{http://schemas.android.com/apk/res/android}'
manifest=ET.parse(root/'AndroidManifest.xml').getroot()
version=manifest.attrib[NS+'versionName']
target=manifest.find('uses-sdk').attrib[NS+'targetSdkVersion']
tools=a.toolchain.resolve()
# Platform and build tools must match the target API (Google Play requires the current one): pick them by their
# source.properties, so older versions extracted in the same folder are never used by mistake.
def pick(pattern,key,accept):
 for f in sorted(tools.glob(pattern)):
  props=f.parent/'source.properties'
  if props.exists() and any(line.split('=',1)[0]==key and accept(line.split('=',1)[1].strip()) for line in props.read_text().splitlines() if '=' in line):return f
 raise SystemExit(f'Missing {pattern} for Android {target} in {tools}: run python3 android/prepare-toolchain.py')
platform=pick('*/android.jar','AndroidVersion.ApiLevel',lambda v:v==target)
bt=pick('*/aapt2','Pkg.Revision',lambda v:v.split('.')[0]==target).parent
jdk=next(tools.glob('jdk-*/bin/java')).parent.parent
env={**os.environ,'JAVA_HOME':str(jdk),'PATH':str(jdk/'bin')+os.pathsep+os.environ['PATH']}
def run(*args,**kw):subprocess.run([str(v) for v in args],check=True,env=env,**kw)
run('python3',game/'build.py')
build=root/'build'
if build.exists():shutil.rmtree(build)
for d in ['assets','classes','dex']:(build/d).mkdir(parents=True)
html=(game/'index.html').read_text()
# Explicit allowlist: only the full offline game is packaged. No QA, fixtures or saved sessions.
html=html.replace('<head>','<head><script>window.OrbitAndroid=true;</script>',1)
(build/'assets/index.html').write_text(html)
run(bt/'aapt2','compile','--dir',root/'res','-o',build/'resources.zip')
run(jdk/'bin/javac','-encoding','UTF-8','--release','8','-classpath',platform,'-d',build/'classes',*sorted((root/'src').rglob('*.java')))
run(bt/'d8','--lib',platform,'--min-api','26','--output',build/'dex',*sorted((build/'classes').rglob('*.class')))
dexes=sorted((build/'dex').glob('*.dex'))
private=root/'.private';private.mkdir(exist_ok=True);private.chmod(0o700)
dist=root/'dist';dist.mkdir(exist_ok=True)

def check_assets(names,read,prefix):
 assets=[n for n in names if n.startswith(prefix)]
 assert assets==[prefix+'index.html'],assets
 assert read(assets[0]).decode()==html
 return assets

if not a.bundle:
 run(bt/'aapt2','link','-I',platform,'--manifest',root/'AndroidManifest.xml','-A',build/'assets','-o',build/'unsigned.apk',build/'resources.zip')
 with zipfile.ZipFile(build/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
  for dex in dexes:z.write(dex,dex.name)
 run(bt/'zipalign','-f','4',build/'unsigned.apk',build/'aligned.apk')
 key=private/'orbita-test.jks'
 if not key.exists():
  run(jdk/'bin/keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','orbita-test','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Orbita Local Testing, O=Space Explorer, C=BR')
  key.chmod(0o600)
 out=dist/('orbita-'+version+'.apk')
 run(bt/'apksigner','sign','--ks',key,'--ks-key-alias','orbita-test','--ks-pass','pass:android','--key-pass','pass:android','--out',out,build/'aligned.apk')
 run(bt/'apksigner','verify','--verbose',out)
 with zipfile.ZipFile(out) as z:assets=check_assets(z.namelist(),z.read,'assets/')
 summary={'apk':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'assets':assets,'minAndroid':'8.0','targetApi':int(target),'version':version,'bundledSave':False,'networkPermission':False}
 (dist/'build-report.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(json.dumps(summary,indent=2))
 raise SystemExit

# Google Play: resources linked in protobuf format, laid out as the base module, assembled by bundletool and signed with
# the upload key. Play re-signs the installed APKs with the app signing key it keeps (Play App Signing).
bundletool=next(tools.glob('bundletool-all-*.jar'),None)
if not bundletool:raise SystemExit('Missing bundletool in '+str(tools)+': run python3 android/prepare-toolchain.py')
run(bt/'aapt2','link','--proto-format','-I',platform,'--manifest',root/'AndroidManifest.xml','-A',build/'assets','-o',build/'proto.apk',build/'resources.zip')
module=build/'base.zip'
with zipfile.ZipFile(build/'proto.apk') as src,zipfile.ZipFile(module,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for item in src.infolist():
  name=item.filename
  z.writestr('manifest/AndroidManifest.xml' if name=='AndroidManifest.xml' else name,src.read(item))
 for dex in dexes:z.write(dex,'dex/'+dex.name)
out=dist/('orbita-'+version+'.aab')
if out.exists():out.unlink()
run(jdk/'bin/java','-jar',bundletool,'build-bundle','--modules='+str(module),'--output='+str(out))
run(jdk/'bin/java','-jar',bundletool,'validate','--bundle='+str(out))
# The upload key never enters Git (android/.private/). Its password comes from ORBITA_UPLOAD_PASSWORD or is asked once.
key=private/'orbita-upload.jks'
if not os.environ.get('ORBITA_UPLOAD_PASSWORD'):
 secret=getpass.getpass('Senha da chave de upload (mínimo 6 caracteres): ')
 if not key.exists() and getpass.getpass('Repita a senha: ')!=secret:raise SystemExit('As senhas não conferem.')
 env['ORBITA_UPLOAD_PASSWORD']=secret
if len(env['ORBITA_UPLOAD_PASSWORD'])<6:raise SystemExit('A senha precisa ter pelo menos 6 caracteres.')
if not key.exists():
 run(jdk/'bin/keytool','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass:env','ORBITA_UPLOAD_PASSWORD','-alias','orbita-upload','-keyalg','RSA','-keysize','4096','-validity','10000','-dname','CN=Orbita Upload, O=Orbita, C=BR')
 key.chmod(0o600)
 print('Chave de upload criada em '+str(key)+'. Guarde uma cópia e a senha fora deste computador.')
run(jdk/'bin/jarsigner','-keystore',key,'-storepass:env','ORBITA_UPLOAD_PASSWORD','-sigalg','SHA256withRSA','-digestalg','SHA-256',out,'orbita-upload')
run(jdk/'bin/jarsigner','-verify',out)  # no -strict: an upload key is always self-signed
with zipfile.ZipFile(out) as z:
 names=z.namelist();assets=check_assets(names,z.read,'base/assets/')
 assert 'base/manifest/AndroidManifest.xml' in names and any(n.startswith('base/dex/') for n in names) and 'BundleConfig.pb' in names
# The certificate Play will ask for when registering the upload key.
cert=subprocess.run([str(jdk/'bin/keytool'),'-list','-v','-keystore',str(key),'-storepass:env','ORBITA_UPLOAD_PASSWORD','-alias','orbita-upload'],env=env,capture_output=True,text=True,check=True).stdout
sha256=next((l.split(':',1)[1].strip() for l in cert.splitlines() if l.strip().startswith('SHA256:')),'')
summary={'aab':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'uploadCertificateSha256':sha256,'assets':assets,'minAndroid':'8.0','targetApi':int(target),'version':version,'versionCode':int(manifest.attrib[NS+'versionCode']),'bundledSave':False,'networkPermission':False}
(dist/'bundle-report.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
