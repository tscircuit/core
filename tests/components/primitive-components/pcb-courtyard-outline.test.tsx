import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_courtyard_outline", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      {/* Triangle shape */}
      <courtyardoutline
        outline={[
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 1.5, y: 2.5 },
        ]}
      />
      {/* L-shaped polygon on bottom layer */}
      <courtyardoutline
        outline={[
          { x: 5, y: 0 },
          { x: 8, y: 0 },
          { x: 8, y: 1 },
          { x: 6, y: 1 },
          { x: 6, y: 3 },
          { x: 5, y: 3 },
        ]}
        layer="bottom"
      />
    </board>,
  )

  const pcbCourtyardOutlines = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_courtyard_outline")

  expect(pcbCourtyardOutlines.length).toBe(2)
  expect(pcbCourtyardOutlines[0]).toMatchObject({
    type: "pcb_courtyard_outline",
    outline: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 1.5, y: 2.5 },
    ],
    layer: "top",
  })
  expect(pcbCourtyardOutlines[1]).toMatchObject({
    type: "pcb_courtyard_outline",
    outline: [
      { x: 5, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 1 },
      { x: 6, y: 1 },
      { x: 6, y: 3 },
      { x: 5, y: 3 },
    ],
    layer: "bottom",
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
