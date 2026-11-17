import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { resolve, join } from "node:path"
import type { AutoroutingStartEvent } from "lib/events"
import {
  compareNativeH3InitialInputs,
  compareNativeH3PhaseRequests,
  hashNativeH3Input,
  type NativeH3InputEvidence,
} from "../../tests/fixtures/h3-routing-phase-intent/input-evidence"

const [baselineDirectory, consumerDirectory] = process.argv.slice(2)
if (!baselineDirectory || !consumerDirectory)
  throw new Error(
    "Usage: bun scripts/diagnostics/compare-native-h3-routing-inputs.ts <baseline output> <consumer output>",
  )
const baselinePath = resolve(baselineDirectory)
const consumerPath = resolve(consumerDirectory)
const baseline: NativeH3InputEvidence & { inputSha256: string } = JSON.parse(
  readFileSync(join(baselinePath, "input-evidence.json"), "utf8"),
)
const consumer: NativeH3InputEvidence & { inputSha256: string } = JSON.parse(
  readFileSync(join(consumerPath, "input-evidence.json"), "utf8"),
)
const { inputSha256: baselineHash, ...baselineInput } = baseline
const { inputSha256: consumerHash, ...consumerInput } = consumer
if (
  hashNativeH3Input(baselineInput) !== baselineHash ||
  hashNativeH3Input(consumerInput) !== consumerHash
)
  throw new Error(
    "Native H3 input evidence failed its recorded SHA256 integrity check",
  )
const pinnedFixture =
  "5eb3790b04c95ea93001e979bc8d4823b43573532d899a94588a946a5176a209"
if (
  baseline.fixtureSha256 !== pinnedFixture ||
  consumer.fixtureSha256 !== pinnedFixture
)
  throw new Error("Paired runs must use the pinned native H3 fixture")
const initial = compareNativeH3InitialInputs({ baseline, consumer })
const phaseRequests = [0, 1, 2].map((phaseIndex) => {
  const before = join(baselinePath, `phase-${phaseIndex}-start.json`)
  const after = join(consumerPath, `phase-${phaseIndex}-start.json`)
  if (!existsSync(before) || !existsSync(after))
    return { phaseIndex, observedInBoth: false, matches: false }
  const baseline: AutoroutingStartEvent = JSON.parse(
    readFileSync(before, "utf8"),
  )
  const consumer: AutoroutingStartEvent = JSON.parse(
    readFileSync(after, "utf8"),
  )
  return {
    phaseIndex,
    observedInBoth: true,
    matches: compareNativeH3PhaseRequests({
      baseline,
      consumer,
      initialBaseline: baselineInput.initialPhaseInput,
      initialConsumer: consumerInput.initialPhaseInput,
    }),
  }
})
const preservation = [baselinePath, consumerPath].map((path) => {
  const proofFile = join(path, "routing-proof.json")
  if (!existsSync(proofFile))
    return { path, available: false, preserved: false }
  const proof: {
    copper: {
      initialToByte0Preserved: boolean
      byte0ToByte1Preserved: boolean
      byte1ToFinalPreserved: boolean
    }
  } = JSON.parse(readFileSync(proofFile, "utf8"))
  return {
    path,
    available: true,
    preserved:
      proof.copper.initialToByte0Preserved &&
      proof.copper.byte0ToByte1Preserved &&
      proof.copper.byte1ToFinalPreserved,
  }
})
const resources = [baselinePath, consumerPath].map((path) => {
  const resourceFile = join(path, "resources.json")
  if (!existsSync(resourceFile))
    return { path, available: false, withinBudgets: false }
  const resource: {
    workerCompletedWithinBudgets: boolean
    renderBudgetExceeded: boolean
    assessmentTimedOut: boolean
  } = JSON.parse(readFileSync(resourceFile, "utf8"))
  return {
    path,
    available: true,
    withinBudgets:
      resource.workerCompletedWithinBudgets &&
      !resource.renderBudgetExceeded &&
      !resource.assessmentTimedOut,
  }
})
const pairedInputsAndPreservedCopperVerified =
  Object.values(initial).every(Boolean) &&
  phaseRequests.every((phase) => phase.matches) &&
  preservation.every((run) => run.available && run.preserved) &&
  resources.every((run) => run.available && run.withinBudgets)
const report = {
  schemaVersion: 1,
  pairedInputsAndPreservedCopperVerified,
  initial,
  phaseRequests,
  preservation,
  resources,
  baselineInputSha256: baselineHash,
  consumerInputSha256: consumerHash,
  note: "Later generated copper may differ; the entire initial SRJ, including supplied copper, is compared exactly and each run must preserve its own earlier accepted output.",
}
writeFileSync(
  join(consumerPath, "paired-input-comparison.json"),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report))
if (!pairedInputsAndPreservedCopperVerified) process.exitCode = 1
