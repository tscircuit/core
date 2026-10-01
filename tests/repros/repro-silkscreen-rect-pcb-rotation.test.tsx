import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("silkscreenrect should preserve pcbRotation", () => {
  const { circuit } = getTestFixture()

  // Current props types omit pcbRotation; use a spread to reproduce the bug.
  const rectangle30Props = { width: 6, height: 2, pcbRotation: 30 }
  const rectangle45Props = { width: 6, height: 2, pcbRotation: 45 }
  const rectangle0Props = { width: 6, height: 2, pcbRotation: 0 }
  const rectangle90Props = { width: 6, height: 2, pcbRotation: 90 }
  const rectangle180Props = { width: 6, height: 2, pcbRotation: 180 }

  circuit.add(
    <board width={64} height={14}>
      <pcbnotetext
        pcbY={5.5}
        fontSize={1.2}
        text="Expected rectangle rotation (CCW)"
      />

      <pcbnotetext pcbX={-24} pcbY={4} fontSize={1.1} text="30 deg" />
      <silkscreenrect {...rectangle30Props} pcbX={-24} filled={false} />

      <pcbnotetext pcbX={-12} pcbY={4} fontSize={1.1} text="45 deg" />
      <silkscreenrect {...rectangle45Props} pcbX={-12} filled={false} />

      <pcbnotetext pcbX={0} pcbY={4} fontSize={1.1} text="0 deg" />
      <silkscreenrect {...rectangle0Props} pcbX={0} filled={false} />

      <pcbnotetext pcbX={12} pcbY={4} fontSize={1.1} text="90 deg" />
      <silkscreenrect {...rectangle90Props} pcbX={12} filled={false} />

      <pcbnotetext pcbX={24} pcbY={4} fontSize={1.1} text="180 deg" />
      <silkscreenrect {...rectangle180Props} pcbX={24} filled={false} />
    </board>,
  )
  circuit.render()

  // Captures the bug: 30/45-degree rectangles stay horizontal. The 0/90/180-degree
  // controls already look correct. Update the snapshot after fixing rotation.
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const [rectangle30, rectangle45] = circuit.db.pcb_silkscreen_rect.list()
  // Remove test.failing when Core emits the requested board-space rotation.
  expect(rectangle30.ccw_rotation).toBeCloseTo(30)
  expect(rectangle45.ccw_rotation).toBeCloseTo(45)
})
