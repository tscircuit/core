import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("trace thickness should work with kicad footprints and pcbPath", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({ footprintCircuitJson: external0402Footprint }),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="kicad:0402"
        pcbX={3}
        pcbY={0}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPath={[{ x: 0, y: 2 }]}
        thickness="0.5mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected trace to be routed")
  expect(
    pcbTrace.route
      .filter((segment) => segment.route_type === "wire")
      .every((segment) => segment.width === 0.5),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
