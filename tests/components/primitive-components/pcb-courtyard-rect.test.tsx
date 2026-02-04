import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_courtyard_rect", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <courtyardrect width={2} height={3} />
      <courtyardrect width={4} height={1} pcbX={5} layer="bottom" />
    </board>,
  )

  const pcbCourtyardRects = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_courtyard_rect")

  expect(pcbCourtyardRects.length).toBe(2)
  expect(pcbCourtyardRects[0]).toMatchObject({
    type: "pcb_courtyard_rect",
    width: 2,
    height: 3,
    layer: "top",
    center: { x: 0, y: 0 },
  })
  expect(pcbCourtyardRects[1]).toMatchObject({
    type: "pcb_courtyard_rect",
    width: 4,
    height: 1,
    layer: "bottom",
    center: { x: 5, y: 0 },
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
