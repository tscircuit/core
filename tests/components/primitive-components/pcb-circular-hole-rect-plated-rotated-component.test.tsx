import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb circular hole rect plated rotated component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={1.5}
        rectPadWidth={4}
        rectPadHeight={2}
        pcbX={2}
        pcbY={2}
        pcbRotation={45}
      />
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={1}
        rectPadWidth={4}
        rectPadHeight={2}
        pcbX={-2}
        pcbY={-2}
        pcbRotation={90}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
