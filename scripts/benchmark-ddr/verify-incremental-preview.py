import hashlib
import io
import json
import tarfile
import urllib.request
from pathlib import Path

archives = {}
for revision in ['base', 'head']:
    root = Path(revision)
    manifest = json.loads((root / 'package.json').read_text())
    for name in ['@tscircuit/capacity-autorouter', '@tscircuit/bus-lanes-solver']:
        pin = manifest.get('devDependencies', {}).get(name, manifest.get('dependencies', {}).get(name))
        if not pin.startswith('https://'):
            continue
        if pin not in archives:
            request = urllib.request.Request(pin, headers={'User-Agent': 'bun/1.4.3'})
            archives[pin] = urllib.request.urlopen(request).read()
        package = root / 'node_modules' / name
        installed = json.loads((package / 'package.json').read_text())
        entry = installed.get('module') or installed.get('main') or 'index.js'
        relative = entry.removeprefix('./')
        with tarfile.open(fileobj=io.BytesIO(archives[pin]), mode='r:gz') as archive:
            candidates = [member for member in archive.getmembers() if member.isfile() and member.name.endswith('/' + relative)]
            assert len(candidates) == 1, (pin, relative, len(candidates))
            expected = hashlib.sha256(archive.extractfile(candidates[0]).read()).hexdigest()
        actual = hashlib.sha256((package / entry).read_bytes()).hexdigest()
        assert actual == expected, f'{revision} {name}: installed runtime does not match declared preview'
        print('PREVIEW_SHA=' + json.dumps({'revision': revision, 'package': name, 'pin': pin, 'sha256': actual}))
