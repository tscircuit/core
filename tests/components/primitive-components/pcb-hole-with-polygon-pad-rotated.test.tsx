import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon plated holes with and without component rotation", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <platedhole
        portHints={["pin1"]}
        shape="hole_with_polygon_pad"
        holeShape="circle"
        holeDiameter={0.8}
        holeOffsetX={0.5}
        holeOffsetY={0.2}
        padOutline={[
          { x: -2, y: -1 },
          { x: 2, y: -1 },
          { x: 2, y: 1 },
          { x: -2, y: 1 },
        ]}
      />
    </footprint>
  )

  circuit.add(
    <board width="20mm" height="12mm">
      <chip name="U1" pcbX={-4} pcbY={0} footprint={footprint} />
      <chip
        name="U2"
        pcbX={4}
        pcbY={0}
        pcbRotation={90}
        footprint={footprint}
      />
      <pcbnotetext text="U1: 0 degrees" pcbX={-4} pcbY={-3} fontSize={0.5} />
      <pcbnotetext text="U2: 90 degrees" pcbX={4} pcbY={-3} fontSize={0.5} />
    </board>,
  )

  circuit.render()

  const platedHoleRotations = circuit.db.pcb_plated_hole
    .list()
    .filter((hole) => hole.shape === "hole_with_polygon_pad")
    .map((hole) => hole.ccw_rotation)

  expect(platedHoleRotations).toEqual([0, 90])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
