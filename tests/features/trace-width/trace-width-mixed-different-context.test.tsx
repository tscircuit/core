import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("different trace widths in same board context", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="25mm">
      {/* Multiple traces with different widths */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={3}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={0}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={-3}
      />
      <resistor
        name="R4"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={0}
      />

      {/* Different trace widths */}
      <trace
        from=".R1 > .pin2"
        to=".R4 > .pin1"
        thickness="0.5mm"
        pcbPath={[]}
      />
      <trace
        from=".R2 > .pin2"
        to=".R4 > .pin1"
        thickness="0.2mm"
        pcbPath={[]}
      />
      <trace
        from=".R3 > .pin2"
        to=".R4 > .pin2"
        thickness="0.1mm"
        pcbPath={[]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(3)

  // Verify each trace maintains its specified width
  const thickTrace = traces.find(t => {
    const wireSegments = t.route.filter(s => s.route_type === "wire")
    return wireSegments.length > 0 && wireSegments[0].width === 0.5
  })
  const mediumTrace = traces.find(t => {
    const wireSegments = t.route.filter(s => s.route_type === "wire")
    return wireSegments.length > 0 && wireSegments[0].width === 0.2
  })
  const thinTrace = traces.find(t => {
    const wireSegments = t.route.filter(s => s.route_type === "wire")
    return wireSegments.length > 0 && wireSegments[0].width === 0.1
  })

  expect(thickTrace).toBeDefined()
  expect(mediumTrace).toBeDefined()
  expect(thinTrace).toBeDefined()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})