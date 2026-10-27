import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 2 mm wide copper bar from y = -1.5 to 1.5; its copper spans y = -2.5..2.5
const wideCopperBarRoute = [
  { route_type: "wire", x: 0, y: -1.5, width: 2, layer: "top" },
  { route_type: "wire", x: 0, y: 1.5, width: 2, layer: "top" },
] satisfies PcbTraceRoutePoint[]

test("the autorouter keeps clear of the full width of a wide pcbtrace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" layers={1}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbtrace route={wideCopperBarRoute} />
      <pcbnotetext
        pcbX={0}
        pcbY={4.5}
        fontSize={0.45}
        text="2 mm wide pcbtrace: R1-R2 must not touch its copper"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const overlapErrors = (
    await runAllRoutingChecks(circuit.getCircuitJson())
  ).filter(
    (error) =>
      "message" in error && error.message.includes("accidental contact"),
  )
  expect(overlapErrors).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
