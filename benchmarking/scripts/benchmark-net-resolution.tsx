/** Run a fresh process per sample: bun benchmarking/scripts/benchmark-net-resolution.tsx [component-count] [declared|implicit]
 * Includes complete renderUntilSettled, not just CreateNetsFromProps.
 */
import { createHash } from "node:crypto"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { Benchmark3ImportedNetResolution } from "../benchmarks/benchmark3-imported-net-resolution"
const componentCount = Number(process.argv[2] ?? 1500)
const declaredNets = process.argv[3] !== "implicit"
const Circuit = process.env.CORE_BUNDLE
  ? (await import(process.env.CORE_BUNDLE)).RootCircuit
  : RootCircuit
const circuit: RootCircuit = new Circuit({
  platform: {
    drcChecksDisabled: true,
    partsEngineDisabled: true,
    schematicDisabled: true,
  },
})
const phases: Record<string, number> = {}
let activePhase: string | undefined
let phaseStarted = 0
const finishPhase = () => {
  if (activePhase)
    phases[activePhase] =
      (phases[activePhase] ?? 0) + performance.now() - phaseStarted
}
// Board-level events avoid millions of per-component lifecycle callbacks.
circuit.on("board:renderPhaseStarted", ({ phase }) => {
  finishPhase()
  activePhase = phase
  phaseStarted = performance.now()
})
const started = performance.now()
circuit.add(
  <Benchmark3ImportedNetResolution
    componentCount={componentCount}
    declaredNets={declaredNets}
  />,
)
await circuit.renderUntilSettled()
finishPhase()
const renderMs = performance.now() - started
const json = circuit.getCircuitJson()
const counts: Record<string, number> = {}
for (const record of json) counts[record.type] = (counts[record.type] ?? 0) + 1
console.log(
  JSON.stringify(
    {
      componentCount,
      declaredNets,
      renderMs,
      records: json.length,
      counts,
      phases,
      sha256: createHash("sha256").update(JSON.stringify(json)).digest("hex"),
    },
    null,
    2,
  ),
)
if (json.some((record) => record.type.includes("error"))) process.exitCode = 1
