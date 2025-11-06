import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit autorouter behavior with trace width constraints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="dense-circuit" autorouter="sequential-trace">
        {/* Components placed close together to test routing constraints */}
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-1}
          pcbY={1}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={1}
          pcbY={1}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-1}
          pcbY={-1}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={1}
          pcbY={-1}
        />

        {/* Different trace widths in constrained space */}
        <trace
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          thickness="0.2mm"
        />
        <trace
          from=".R3 > .pin2"
          to=".R4 > .pin1"
          thickness="0.15mm"
        />
        <trace
          from=".R1 > .pin1"
          to=".R3 > .pin1"
          thickness="0.3mm"
        />
        <trace
          from=".R2 > .pin2"
          to=".R4 > .pin2"
          thickness="0.25mm"
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(4)

  // Verify all traces maintain their specified widths despite dense routing
  const expectedWidths = [0.2, 0.15, 0.3, 0.25]
  const actualWidths = traces.map(t => {
    const wireSegments = t.route.filter(s => s.route_type === "wire")
    return wireSegments.length > 0 ? wireSegments[0].width : 0
  }).sort()

  expect(actualWidths).toEqual(expectedWidths.sort())

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})