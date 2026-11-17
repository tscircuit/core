import { mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { isDeepStrictEqual } from "node:util"
import type { RootCircuit } from "lib/RootCircuit"
import { createHash } from "node:crypto"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import {
  runNativeH3Routing,
  getNativeH3Geometry,
  NATIVE_H3_FIXTURE_SHA256,
} from "../../tests/fixtures/h3-routing-phase-intent/run"
import { assessNativeH3Routing } from "../../tests/fixtures/h3-routing-phase-intent/assess"
import { getNativeH3CopperPreservation } from "../../tests/fixtures/h3-routing-phase-intent/copper"
import { getH3RoutedSnapshot } from "../../tests/fixtures/h3-routing-phase-intent/routed-snapshot"
import { getNativeH3AccessEvidence } from "../../tests/fixtures/h3-routing-phase-intent/access-evidence"
import { hashNativeH3Input } from "../../tests/fixtures/h3-routing-phase-intent/input-evidence"

// The same diagnostic runs both real source checkouts. Only RootCircuit is
// selected here; the native TSX, pads, rules, presets and later phases are the
// same. The released-solver control needs no new getter or adapter fallback.
const [coreDirectory, outputDirectory, mode] = process.argv.slice(2)
if (
  !coreDirectory ||
  !outputDirectory ||
  (mode !== "baseline" && mode !== "consumer")
) {
  throw new Error(
    "Usage: bun scripts/diagnostics/native-h3-routing-access.tsx <Core checkout> <output directory> <baseline|consumer>",
  )
}
const corePath = resolve(coreDirectory)
const outputPath = resolve(outputDirectory)
mkdirSync(outputPath, { recursive: true })
const saveJson = (name: string, value: object) =>
  writeFileSync(join(outputPath, name), JSON.stringify(value, null, 2))
const selectedAdapter = await import(
  pathToFileURL(
    join(corePath, "lib/utils/autorouting/get-bus-lanes-input-from-srj.ts"),
  ).href
)
if (selectedAdapter.getBusLanesInputFromSrj !== getBusLanesInputFromSrj) {
  throw new Error(
    "Diagnostic lib imports must use the selected Core checkout's tsconfig; run the supervised diagnostic command",
  )
}
const hashFile = (path: string | URL) =>
  createHash("sha256").update(readFileSync(path)).digest("hex")
const fixtureFiles = {
  fixtureSha256: hashFile(
    new URL(
      "../../tests/fixtures/h3-routing-phase-intent/source.json.gz",
      import.meta.url,
    ),
  ),
  boardTsxSha256: hashFile(
    new URL(
      "../../tests/fixtures/h3-routing-phase-intent/board.tsx",
      import.meta.url,
    ),
  ),
  nativePartSha256: hashFile(
    new URL(
      import.meta.resolve("@tscircuit/core-ddr-benchmark/circuits/native-part"),
    ),
  ),
}
if (fixtureFiles.fixtureSha256 !== NATIVE_H3_FIXTURE_SHA256)
  throw new Error("The native H3 source fixture differs from the pinned input")
const corePackage: { devDependencies: Record<string, string> } = JSON.parse(
  readFileSync(join(corePath, "package.json"), "utf8"),
)
const installedBusDirectory = join(
  corePath,
  "node_modules/@tscircuit/bus-lanes-solver",
)
const installedBusPackage: {
  module?: string
  main?: string
  exports?: { "."?: { import?: string } }
} = JSON.parse(
  readFileSync(join(installedBusDirectory, "package.json"), "utf8"),
)
const busExecutable =
  installedBusPackage.exports?.["."]?.import ??
  installedBusPackage.module ??
  installedBusPackage.main
if (!busExecutable)
  throw new Error("The installed bus solver has no executable package entry")
saveJson("run-environment.json", {
  schemaVersion: 1,
  corePath,
  mode,
  bunVersion: Bun.version,
  fixtureFiles,
  corePackageSha256: hashFile(join(corePath, "package.json")),
  declaredBusSolver: corePackage.devDependencies["@tscircuit/bus-lanes-solver"],
  installedBusPackageSha256: hashFile(
    join(corePath, "node_modules/@tscircuit/bus-lanes-solver/package.json"),
  ),
  installedBusExecutable: busExecutable,
  installedBusExecutableSha256: hashFile(
    resolve(installedBusDirectory, busExecutable),
  ),
  sourceIsolation: "selected_core_tsconfig_verified",
})
const coreModule = await import(
  pathToFileURL(join(corePath, "lib/RootCircuit.ts")).href
)
await import(pathToFileURL(join(corePath, "lib/register-catalogue.ts")).href)
const circuit: RootCircuit = new coreModule.RootCircuit()
// Preserve replayable completed output even if a later real phase exceeds the
// external process budget. Progress files never contain rejected candidates.
let initialInputSaved = false
for (const eventName of [
  "autorouting:start",
  "autorouting:end",
  "autorouting:error",
] as const) {
  circuit.on(eventName, (event) => {
    if (event.type === "autorouting:start" && !initialInputSaved) {
      const initialCircuitJson = circuit.getCircuitJson()
      const initialGeometry = getNativeH3Geometry(initialCircuitJson)
      const inputEvidence = {
        ...fixtureFiles,
        initialGeometry,
        initialCopper: initialCircuitJson.filter(
          (element) =>
            element.type === "pcb_trace" || element.type === "pcb_via",
        ),
        initialPhaseInput: event.simpleRouteJson,
      }
      saveJson("initial-circuit.json", initialCircuitJson)
      saveJson("initial-geometry.json", initialGeometry)
      saveJson("input-evidence.json", {
        ...inputEvidence,
        inputSha256: hashNativeH3Input(inputEvidence),
      })
      initialInputSaved = true
    }
    saveJson(
      `phase-${event._actualRoutingPhaseOrderIndex ?? 0}-${eventName.split(":")[1]}.json`,
      event,
    )
    saveJson("circuit-progress.json", circuit.getCircuitJson())
  })
}
for (const eventName of ["solver:started", "solver:ended"] as const) {
  circuit.on(eventName, (event) =>
    saveJson(`latest-${eventName.replace(":", "-")}.json`, event),
  )
}
const result = await runNativeH3Routing(circuit)
const { source, stages, circuitJson } = result
const renderHighWater =
  process.platform === "linux"
    ? readFileSync("/proc/self/status", "utf8").match(/VmHWM:\s+(\d+)/)
    : null
const renderPeakRssMb = renderHighWater
  ? Number(renderHighWater[1]) / 1024
  : null
saveJson("routing-run.json", {
  corePath,
  mode,
  renderMs: result.renderMs,
  renderPeakRssMb,
  processMsAtRenderEnd: process.uptime() * 1000,
  renderError: result.renderError,
  stages,
  solverNames: result.solverNames,
})
saveJson("circuit.json", circuitJson)
saveJson("initial-geometry.json", result.initialGeometry)
const assessment = assessNativeH3Routing({
  circuit,
  source,
  stages,
  initialCircuitJson: result.initialCircuitJson,
})
const copper = getNativeH3CopperPreservation({ stages, circuitJson })
const geometryPreserved = isDeepStrictEqual(
  getNativeH3Geometry(circuitJson),
  result.initialGeometry,
)
const drcErrors = Object.values(assessment.drc).reduce(
  (sum, count) => sum + count,
  0,
)
const reports = stages.map(
  (stage) => stage.solverEnded?.pendingRoutingAccessReport,
)
const accessEvidence = getNativeH3AccessEvidence({
  stages,
  solverNames: result.solverNames,
})
const accessVerified = Object.values(accessEvidence).every(Boolean)
const warningCount = Object.values(assessment.warnings).reduce(
  (sum, count) => sum + count,
  0,
)
const phaseViaPadVerified = assessment.phaseViaPad.every(
  (phase) =>
    phase.completed &&
    phase.errorCount === 0 &&
    phase.matchedFinalViaCount === phase.newlyGeneratedViaCount,
)
const phasesCompleted =
  stages.length === 3 &&
  stages.every((stage) => stage.end && !stage.error) &&
  accessEvidence.phaseOrderVerified &&
  accessEvidence.solverOrderVerified &&
  accessEvidence.futureRequestsVerified
const complete =
  result.renderError === undefined &&
  phasesCompleted &&
  result.renderMs < 300_000 &&
  assessment.connectedNets === 53 &&
  drcErrors === 0 &&
  assessment.requestedWidthViolationCount === 0 &&
  phaseViaPadVerified &&
  geometryPreserved &&
  copper.initialToByte0Preserved &&
  copper.byte0ToByte1Preserved &&
  copper.byte1ToFinalPreserved &&
  (mode === "baseline" || accessVerified)
const label = `${mode.toUpperCase()} ${complete ? "COMPLETE" : "FAILED / INCOMPLETE"}`
const phaseStatus = stages
  .map(
    (stage) =>
      `${stage.start.phaseName}: ${stage.error ? "failed" : stage.end ? "completed" : "unfinished"}`,
  )
  .join("; ")
const accessStatus =
  mode === "baseline"
    ? "Released solver has no accepted future-access report; access is unevaluated."
    : accessVerified
      ? "Actual bus solvers accepted both future-access checks."
      : "Future-access acceptance is incomplete."
const status = [
  `${assessment.connectedNets}/${assessment.requestedNets} physically connected nets; ${drcErrors} DRC errors; ${warningCount} warnings; ${assessment.requestedWidthViolationCount} width violations; ${(result.renderMs / 1000).toFixed(1)}s render`,
  phaseStatus,
  accessStatus,
  `Native geometry ${geometryPreserved ? "unchanged" : "CHANGED"}; byte copper ${copper.initialToByte0Preserved && copper.byte0ToByte1Preserved && copper.byte1ToFinalPreserved ? "unchanged" : "changed or missing"}. Timing unqualified.`,
]
saveJson("assessment.json", { ...assessment, findings: undefined })
saveJson("findings.json", assessment.findings)
saveJson("routing-proof.json", {
  schemaVersion: 1,
  corePath,
  mode,
  label,
  complete,
  renderMs: result.renderMs,
  renderError: result.renderError,
  geometryPreserved,
  copper,
  accessVerified,
  accessEvidence,
  phaseViaPadVerified,
  solverNames: result.solverNames,
  stages,
  fixtureSha256:
    "5eb3790b04c95ea93001e979bc8d4823b43573532d899a94588a946a5176a209",
})
// Diagnostic failure output is explicitly labelled and is never an after
// golden. It contains only the actual final circuit and completed stage output;
// unfinished or rejected solver candidates are never materialized as copper.
writeFileSync(
  join(outputPath, `h3-${mode}-${complete ? "complete" : "incomplete"}.svg`),
  getH3RoutedSnapshot({ circuitJson, title: `Native H3: ${label}`, status }),
)
for (const [stageIndex, stage] of stages.slice(0, 2).entries()) {
  if (!stage.end) continue
  const report = reports[stageIndex]
  writeFileSync(
    join(outputPath, `h3-${mode}-accepted-byte-${stageIndex}.svg`),
    getH3RoutedSnapshot({
      circuitJson,
      stage,
      title: `Native H3: ${label}; completed byte ${stageIndex} copper`,
      status: [
        `${stage.end.simpleRouteJson.traces?.length ?? 0} actual accumulated traces; teal crosses mark explicitly pending terminals`,
        report
          ? `${report.baselineAccessibleFramedTerminalCount}/${report.framedTerminalCount} initially accessible; ${report.baselineInaccessibleFramedTerminalCount} already inaccessible; ${report.newlyBlockedConnectionNames.length} newly blocked nets`
          : "No accepted future-access report from this solver version.",
        "Only the completed stage copper is shown; the full-run status appears above.",
      ],
    }),
  )
}
console.log(
  JSON.stringify({
    label,
    connectedNets: assessment.connectedNets,
    drc: assessment.drc,
    renderMs: result.renderMs,
    copper,
    geometryPreserved,
    outputPath,
  }),
)
if (mode === "consumer" && !complete) process.exitCode = 1
