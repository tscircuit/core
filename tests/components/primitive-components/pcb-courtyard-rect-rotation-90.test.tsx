import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_courtyard_rect rotation 90 on bottom layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="pinrow6"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        layer="bottom"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const pcbCourtyardRects = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_courtyard_rect")

  // Quarter-turn rotations are baked into width/height (axis-aligned rect)
  expect(pcbCourtyardRects[0].ccw_rotation).toBeUndefined()
  expect(pcbCourtyardRects[0].width).toBeCloseTo(3.54)
  expect(pcbCourtyardRects[0].height).toBeCloseTo(16.24)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
