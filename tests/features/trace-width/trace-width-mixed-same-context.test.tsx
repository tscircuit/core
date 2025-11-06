import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mixed trace widths within same routing context", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      {/* Power rails with different trace widths */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={2}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={-2}
      />
      <resistor name="R3" resistance="10k" footprint="0402" pcbX={8} pcbY={0} />

      {/* High current trace - thick */}
      <trace
        from=".R1 > .pin2"
        to=".R3 > .pin1"
        thickness="0.5mm"
        pcbPath={[]}
      />
      {/* Signal trace - thin */}
      <trace
        from=".R2 > .pin2"
        to=".R3 > .pin2"
        thickness="0.15mm"
        pcbPath={[]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(2)

  // Find traces by their approximate routing (this is a bit fragile but works for this test)
  const thickTrace = traces.find((t) => {
    const wireSegments = t.route.filter((s) => s.route_type === "wire")
    return wireSegments.length > 0 && wireSegments[0].width === 0.5
  })

  const thinTrace = traces.find((t) => {
    const wireSegments = t.route.filter((s) => s.route_type === "wire")
    return wireSegments.length > 0 && wireSegments[0].width === 0.15
  })

  expect(thickTrace).toBeDefined()
  expect(thinTrace).toBeDefined()

  // Verify thick trace maintains 0.5mm width
  if (thickTrace) {
    expect(
      thickTrace.route
        .filter((segment) => segment.route_type === "wire")
        .every((segment) => segment.width === 0.5),
    ).toBe(true)
  }

  // Verify thin trace maintains 0.15mm width
  if (thinTrace) {
    expect(
      thinTrace.route
        .filter((segment) => segment.route_type === "wire")
        .every((segment) => segment.width === 0.15),
    ).toBe(true)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
