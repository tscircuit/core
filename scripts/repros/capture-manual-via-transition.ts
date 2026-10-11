import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import { Resvg } from "@resvg/resvg-js"
import {
  manualViaTransitionCases,
  renderManualViaTransition,
} from "tests/fixtures/manual-via-transition"
import { renderManualViaTransitionSvg } from "tests/fixtures/manual-via-transition-svg"

const destination = resolve(
  process.argv[2] ?? "debug-output/manual-via-transition",
)
await mkdir(destination, { recursive: true })
const results = []
for (const api of ["pcbPath", "pcbPaths"] as const) {
  for (const scenario of manualViaTransitionCases.filter(
    (scenario) => scenario.invalid,
  )) {
    const circuit = await renderManualViaTransition(api, scenario)
    const errors = circuit.db.pcb_trace_error.list()
    const diagnosed = errors.some((error) =>
      /via.*does not reach.*(top|inner1)/i.test(error.message),
    )
    const traceCount = circuit.db.pcb_trace.list().length
    const viaCount = circuit.db.pcb_via.list().length
    const status =
      diagnosed && traceCount === 0 && viaCount === 0 ? "PASS" : "FAIL"
    results.push({
      api,
      scenario: scenario.name,
      status,
      diagnosed,
      traceCount,
      viaCount,
      errors,
    })
    await Bun.write(
      `${destination}/${status.toLowerCase()}-${api}-${scenario.name}.json`,
      JSON.stringify(circuit.getCircuitJson(), null, 2) + "\n",
    )
    if (scenario.name !== "disconnected_top") continue
    const svg = renderManualViaTransitionSvg(circuit, api)
    const basename = `${destination}/${status.toLowerCase()}-${api}`
    await Bun.write(`${basename}.svg`, svg)
    await Bun.write(`${basename}.png`, new Resvg(svg).render().asPng())
  }
}
console.log(JSON.stringify(results, null, 2))
const status = results.every((result) => result.status === "PASS")
  ? "pass"
  : "fail"
await Bun.write(
  `${destination}/${status}-results.json`,
  JSON.stringify(results, null, 2) + "\n",
)
if (status === "fail") process.exitCode = 1
