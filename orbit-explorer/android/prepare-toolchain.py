"""Restore the pinned official Android build tools; verify every downloaded archive."""
from pathlib import Path
import argparse, concurrent.futures, hashlib, os, tarfile, urllib.request, zipfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, default=Path('/tmp/orbita-android-toolchain'))
root = parser.parse_args().directory.resolve()
root.mkdir(parents=True, exist_ok=True)
repository = urllib.request.urlopen('https://dl.google.com/android/repository/repository2-1.xml', timeout=90).read()
tree = ET.fromstring(repository)
archives = ['platform-35_r02.zip', 'build-tools_r35_linux.zip']
jobs = []
for name in archives:
    match = next(a for a in tree.iter('complete') if a.findtext('url') == name)
    jobs.append((name, 'https://dl.google.com/android/repository/' + name, 'sha1', match.findtext('checksum')))
jobs.append(('jdk.tar.gz', 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_linux_hotspot_17.0.20.1_1.tar.gz', 'sha256', '3808d1d15e3ec6bd5b84057fb5d84c33d8a1536a258146bcea2e603fc726e08e'))

def fetch(job):
    name, url, algorithm, expected = job
    archive = root / name
    if not archive.exists():
        with urllib.request.urlopen(url, timeout=120) as response, archive.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
    actual = hashlib.new(algorithm, archive.read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError('Checksum mismatch: ' + name + '. Remove the incomplete archive and retry.')
    print('Verified ' + name, flush=True)
    return archive

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    files = list(pool.map(fetch, jobs))
for archive in files:
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
    else:
        with tarfile.open(archive) as t:
            t.extractall(root, filter='data')
print('Ready: ' + str(root))
