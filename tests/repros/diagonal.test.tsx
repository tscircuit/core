import { expect, test } from "bun:test"
import { segmentToSegmentMinDistance } from "@tscircuit/math-utils"
import type { PcbTrace, PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const fixedRoute = [
  { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -2 },
  { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
] satisfies PcbTraceRoutePoint[]

async function routeBetweenResistors(withFixedCopper: boolean) {
  const { circuit } = getTestFixture()
  const failures: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) failures.push(String(event.error))
  })
  circuit.add(
    <board width={20} height={12} schematicDisabled autorouter="auto_local">
      <resistor name="R1" resistance={100} footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance={100} footprint="0402" pcbX={5} />
      {withFixedCopper && (
        <chip
          name="FIXED"
          footprint={
            <footprint>
              <pcbtrace route={fixedRoute} />
            </footprint>
          }
        />
      )}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        pcbY={-4}
        text="R1 to R2 across existing 45-degree copper"
        fontSize={0.48}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return { circuit, failures, traces: circuit.db.pcb_trace.list() }
}

// Minimum edge-to-edge gap to the frozen trace, on its copper layer.
function gapToFixedCopper(trace: PcbTrace) {
  let gap = Infinity
  for (let i = 1; i < trace.route.length; i++) {
    const a = trace.route[i - 1]!
    const b = trace.route[i]!
    if (
      a.route_type !== "wire" ||
      b.route_type !== "wire" ||
      a.layer !== "top" ||
      b.layer !== "top"
    )
      continue
    const distance = segmentToSegmentMinDistance(
      a,
      b,
      fixedRoute[0]!,
      fixedRoute[1]!,
    )
    gap = Math.min(gap, distance - (a.width + fixedRoute[0]!.width) / 2)
  }
  return gap
}

test("route R1 to R2 past a frozen top-layer diagonal", async () => {
  const control = await routeBetweenResistors(false)
  expect(control.failures).toEqual([])
  expect(control.traces).toHaveLength(1)
  expect(gapToFixedCopper(control.traces[0]!)).toBeLessThan(0)

  const { circuit, failures, traces } = await routeBetweenResistors(true)
  expect(
    failures.some((error) =>
      error.includes("only supports horizontal and vertical"),
    ),
  ).toBe(true)
  expect(traces).toHaveLength(1)
  expect(traces[0]!.route).toMatchObject(fixedRoute)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
