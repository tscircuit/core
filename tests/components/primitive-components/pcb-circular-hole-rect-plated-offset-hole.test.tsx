import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb circular hole rect plated offset hole", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter={2}
        rectPadWidth={4}
        rectPadHeight={4}
        holeOffsetX={1}
        holeOffsetY={-0.5}
      />
      <platedhole
        shape="pill_hole_with_rect_pad"
        holeShape="pill"
        padShape="rect"
        holeWidth={2}
        holeHeight={3}
        rectPadWidth={4}
        rectPadHeight={5}
        holeOffsetX={-0.75}
        holeOffsetY={0.5}
        pcbX={5.5}
        pcbY={4.5}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
