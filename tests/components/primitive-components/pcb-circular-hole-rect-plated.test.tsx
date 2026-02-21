import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb circular hole rect plated", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        pcbX={-2}
        pcbY={-2}
      />
      <platedhole
        shape="pill_hole_with_rect_pad"
        holeShape="pill"
        padShape="rect"
        holeWidth={2}
        holeHeight={3}
        rectPadWidth={3}
        rectPadHeight={4}
        pcbX={2}
        pcbY={2}
      />
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={1}
        rectPadWidth={3}
        rectPadHeight={2}
        pcbX={2.4}
        pcbY={-2.5}
        pcbRotation={45}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
