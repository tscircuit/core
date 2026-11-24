import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packages = ['@tscircuit/capacity-autorouter', '@tscircuit/bus-lanes-solver', '@tscircuit/checks', '@tscircuit/props', 'circuit-json']
const revisions = {}
for (const revision of ['base', 'head']) {
  const root = resolve(revision)
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  revisions[revision] = {}
  for (const name of packages) {
    if (manifest.dependencies?.[name] && manifest.devDependencies?.[name]) throw new Error(`Duplicate package pin: ${name}`)
    const directory = resolve(root, 'node_modules', name)
    const installed = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
    const entry = resolve(directory, installed.module || installed.main || 'index.js')
    const selectedEntry = Bun.resolveSync(name, root)
    if (realpathSync(selectedEntry) !== realpathSync(entry)) throw new Error(`Inspected file differs from selected import: ${name}`)
    const source = readFileSync(entry)
    const stat = statSync(entry)
    revisions[revision][name] = {
      version: installed.version,
      declared: manifest.devDependencies?.[name] ?? manifest.dependencies?.[name],
      sha256: createHash('sha256').update(source).digest('hex'),
      device: stat.dev,
      inode: stat.ino,
    }
  }
}
for (const name of packages) {
  const before = revisions.base[name]
  const after = revisions.head[name]
  if (before.declared !== after.declared && before.sha256 === after.sha256) throw new Error(`Changed pin resolved to unchanged code: ${name}`)
  if (before.device === after.device && before.inode === after.inode) throw new Error(`Shared writable package file: ${name}`)
}
for (const name of ['@tscircuit/checks', '@tscircuit/props', 'circuit-json']) {
  if (revisions.base[name].sha256 !== revisions.head[name].sha256) throw new Error(`Unmatched shared dependency: ${name}`)
}
writeFileSync('package-provenance.json', JSON.stringify(revisions, null, 2))
console.log('PACKAGE_PROVENANCE=' + JSON.stringify(revisions))
