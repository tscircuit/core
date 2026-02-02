import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_courtyard_circle", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <courtyardcircle radius={2} />
      <courtyardcircle radius={2} pcbX={5} />
    </board>,
  )

  const pcbCourtyardCircles = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_courtyard_circle")

  expect(pcbCourtyardCircles.length).toBe(2)
  expect(pcbCourtyardCircles[0]).toMatchObject({
    type: "pcb_courtyard_circle",
    radius: 2,
    layer: "top",
    center: { x: 0, y: 0 },
  })
  expect(pcbCourtyardCircles[1]).toMatchObject({
    type: "pcb_courtyard_circle",
    radius: 2,
    layer: "top",
    center: { x: 5, y: 0 },
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
