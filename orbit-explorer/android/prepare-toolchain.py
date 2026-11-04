"""Restore the official Android build tools for the manifest's target API; verify every downloaded archive.

Android Platform and Build Tools come from Google's SDK repository (checksums read from its index), the JDK is pinned
by SHA-256, and bundletool (needed only for the Play bundle) is checked against android/toolchain.lock.json: the first
download records its SHA-256 there, so commit that file and every later download must match it.
"""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, os, tarfile, urllib.request, zipfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, default=Path('/tmp/orbita-android-toolchain'))
parser.add_argument('--bundletool', default='1.18.1', help='bundletool release (github.com/google/bundletool/releases)')
args = parser.parse_args()
root = args.directory.resolve()
root.mkdir(parents=True, exist_ok=True)
here = Path(__file__).resolve().parent
NS = '{http://schemas.android.com/apk/res/android}'
target = ET.parse(here / 'AndroidManifest.xml').getroot().find('uses-sdk').attrib[NS + 'targetSdkVersion']
repository = urllib.request.urlopen('https://dl.google.com/android/repository/repository2-1.xml', timeout=90).read()
tree = ET.fromstring(repository)

def revision(package):
    r = package.find('revision')
    return tuple(int(r.findtext(k) or 0) for k in ('major', 'minor', 'micro'))

def sdk_archive(match, label):
    # Newest stable package whose path matches (e.g. any 'build-tools;36.x.y'), Linux or host-independent archive.
    packages = [p for p in tree.iter('remotePackage') if match(p.get('path', '')) and (p.find('channelRef') is None or p.find('channelRef').get('ref') == 'channel-0')]
    if not packages:
        raise SystemExit('No SDK package ' + label + ' in the repository index')
    package = max(packages, key=revision)
    for archive in package.iter('archive'):
        if archive.findtext('host-os') in (None, 'linux'):
            complete = archive.find('complete')
            name = complete.findtext('url')
            return (name, 'https://dl.google.com/android/repository/' + name, 'sha1', complete.findtext('checksum').strip())
    raise SystemExit('No Linux archive for ' + package.get('path'))

jobs = [sdk_archive(lambda path: path == 'platforms;android-' + target, 'platforms;android-' + target),
        sdk_archive(lambda path: path.startswith('build-tools;' + target + '.'), 'build-tools;' + target + '.x')]
jobs.append(('jdk.tar.gz', 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_linux_hotspot_17.0.20.1_1.tar.gz', 'sha256', '3808d1d15e3ec6bd5b84057fb5d84c33d8a1536a258146bcea2e603fc726e08e'))
lock_path = here / 'toolchain.lock.json'
lock = json.loads(lock_path.read_text()) if lock_path.exists() else {}
bundletool = 'bundletool-all-' + args.bundletool + '.jar'
jobs.append((bundletool, 'https://github.com/google/bundletool/releases/download/' + args.bundletool + '/' + bundletool, 'sha256', lock.get(bundletool)))

def fetch(job):
    name, url, algorithm, expected = job
    archive = root / name
    if not archive.exists():
        partial = archive.with_suffix(archive.suffix + '.part')
        with urllib.request.urlopen(url, timeout=120) as response, partial.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        partial.rename(archive)
    actual = hashlib.new(algorithm, archive.read_bytes()).hexdigest()
    if expected is None:
        print('Recorded ' + name + ' ' + actual + ' in ' + lock_path.name + ' (first download): commit it.', flush=True)
        return archive, actual
    if actual != expected:
        raise ValueError('Checksum mismatch: ' + name + '. Remove the archive and retry.')
    print('Verified ' + name, flush=True)
    return archive, actual

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(fetch, jobs))
if bundletool not in lock:
    lock[bundletool] = results[-1][1]
    lock_path.write_text(json.dumps(lock, indent=2, sort_keys=True) + '\n')
for archive, _ in results:
    if archive.suffix == '.zip':
        with zipfile.ZipFile(archive) as z:
            for item in z.infolist():
                destination = (root / item.filename).resolve()
                if not destination.is_relative_to(root):
                    raise ValueError('Invalid archive path')
                z.extract(item, root)
                mode = item.external_attr >> 16
                if mode:
                    os.chmod(destination, mode & 0o777)
    elif archive.name.endswith('.tar.gz'):
        with tarfile.open(archive) as t:
            t.extractall(root, filter='data')
print('Ready for Android ' + target + ': ' + str(root))
