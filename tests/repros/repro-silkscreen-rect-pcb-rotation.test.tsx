import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("silkscreenrect should preserve pcbRotation={30}", () => {
  const { circuit } = getTestFixture()

  // Current props types omit pcbRotation; use a spread to reproduce the bug.
  const rectangleProps = { width: 6, height: 2, pcbRotation: 30 }

  circuit.add(
    <board width={24} height={10}>
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.7}
        text="Expected: rectangle rotated 30 deg CCW"
      />
      <silkscreenrect {...rectangleProps} filled={false} />
    </board>,
  )
  circuit.render()

  // Captures the bug: the rectangle is horizontal. Update after fixing rotation.
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const [rectangle] = circuit.db.pcb_silkscreen_rect.list()
  // Remove test.failing when Core emits the requested board-space rotation.
  expect(rectangle.ccw_rotation).toBeCloseTo(30)
})
