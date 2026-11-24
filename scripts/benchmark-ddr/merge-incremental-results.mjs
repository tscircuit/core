import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const circuits = ['h3', 'a64', 'stmp157', 'orangecrab', 'a13', 'h616', 'butterstick', 'glider', 'imx6', 'icepi']
const benchmark = resolve('tooling/node_modules/@tscircuit/core-ddr-benchmark/scripts')
const { formatReport } = await import(pathToFileURL(resolve(benchmark, 'report.ts')).href)
const { skewCheckCounts } = await import(pathToFileURL(resolve(benchmark, 'report-skew.ts')).href)
const { physicalDrcIssues, isCompleted, isRoutingPass } = await import(pathToFileURL(resolve(benchmark, 'route-quality.ts')).href)
const reports = {}
mkdirSync('aggregate', { recursive: true })
for (const revision of ['base', 'head']) {
  const parts = circuits.map(circuit => JSON.parse(readFileSync(resolve('collected', circuit, revision, 'results.json'), 'utf8')))
  const first = parts[0]
  for (const part of parts) {
    for (const key of ['coreCommit', 'benchmarkRevision', 'assessmentRevision', 'bunVersion', 'timeoutSeconds']) {
      if (part[key] !== first[key]) throw new Error(`Mismatched ${key} across ${revision} circuits`)
    }
    if (JSON.stringify(part.dependencies) !== JSON.stringify(first.dependencies)) throw new Error(`Dependency mismatch across ${revision} circuits`)
  }
  const merged = { ...first, fixtureHashes: Object.assign({}, ...parts.map(part => part.fixtureHashes)), cases: parts.flatMap(part => part.cases) }
  if (new Set(merged.cases.map(circuit => circuit.circuit)).size !== 10) throw new Error(`Missing ${revision} circuits`)
  reports[revision] = merged
  writeFileSync(resolve('aggregate', `${revision}.json`), JSON.stringify(merged, null, 2))
}
const report = formatReport(reports.head, reports.base)
writeFileSync('aggregate/comparison.md', report)
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, report)
const summary = {}
for (const revision of ['base', 'head']) {
  const report = reports[revision]
  summary[revision] = {
    coreCommit: report.coreCommit,
    benchmarkRevision: report.benchmarkRevision,
    dependencies: report.dependencies,
    complete: report.cases.filter(isCompleted).length,
    physicalPass: report.cases.filter(isRoutingPass).length,
    connected: report.cases.reduce((sum, circuit) => sum + (circuit.assessment?.connectedNets || 0), 0),
    requested: report.cases.reduce((sum, circuit) => sum + (circuit.assessment?.requestedNets || 0), 0),
    skew: skewCheckCounts(report),
  }
  for (const circuit of report.cases) {
    const assessment = circuit.assessment
    const matching = Object.fromEntries(Object.entries(assessment?.ddrSkew || {}).map(([name, group]) => [name, { skewMm: group.skewMm, referenceSkewMm: group.referenceSkewMm, matchingStatus: group.matchingStatus }]))
    const targets = (assessment?.ddrConstraints || []).map(check => ({ name: check.name, status: check.status, severity: check.severity, assessmentOnly: check.assessmentOnly, minLength: check.minLength, maxLength: check.maxLength, maxLengthSkew: check.maxLengthSkew, actualMinMm: check.actualMinMm, actualMaxMm: check.actualMaxMm, actualSkewMm: check.actualSkewMm, marginMm: check.marginMm }))
    const fingerprintPath = resolve('collected', circuit.circuit, 'copper-fingerprints.json')
    const fingerprint = JSON.parse(readFileSync(fingerprintPath, 'utf8'))[revision]
    console.log('DDR_CASE=' + JSON.stringify({ revision, fingerprint, circuit: circuit.circuit, status: circuit.status, connected: assessment?.connectedNets, requested: assessment?.requestedNets, physicalPass: isRoutingPass(circuit), physicalIssues: assessment ? physicalDrcIssues(assessment) : null, geometryErrorCount: assessment?.geometryErrors.length, seconds: circuit.wallMs / 1000, peakRssMb: circuit.peakRssMb, vias: assessment?.vias, wireLengthMm: assessment?.wireLengthMm, selectedAttempt: circuit.selectedAttempt, attempts: circuit.attempts, skew: skewCheckCounts({ ...report, cases: [circuit] }), matching, targets }))
  }
}
writeFileSync('aggregate/summary.json', JSON.stringify(summary, null, 2))
console.log('DDR_SUMMARY=' + JSON.stringify(summary))
