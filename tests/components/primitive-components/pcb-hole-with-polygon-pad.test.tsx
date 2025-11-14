import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb plated hole with polygon pad", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <platedhole
        shape="hole_with_polygon_pad"
        holeShape="circle"
        holeDiameter={1.5}
        holeOffsetX={0}
        holeOffsetY={0}
        padOutline={[
          { x: -2, y: -2 },
          { x: 2, y: -2 },
          { x: 2, y: 2 },
          { x: -2, y: 2 },
        ]}
      />
    </footprint>
  )

  circuit.add(
    <board width={40} height={40} material="fr4" thickness={1.6}>
      <chip name="U1" layer="top" footprint={footprint} />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
