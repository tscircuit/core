import { beforeAll, expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Chip } from "lib/components/normal-components/Chip"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const footprint = (
  <footprint>
    <platedhole
      portHints={["pin1"]}
      shape="hole_with_polygon_pad"
      holeShape="circle"
      holeDiameter={0.8}
      holeOffsetX={0}
      holeOffsetY={0}
      padOutline={[
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: 2, y: 1 },
        { x: -2, y: 1 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -2.5, y: -1.5 },
        { x: 2.5, y: -1.5 },
        { x: 2.5, y: 1.5 },
        { x: -2.5, y: 1.5 },
        { x: -2.5, y: -1.5 },
      ]}
    />
  </footprint>
)
const placements = (["top", "bottom"] as const).flatMap((layer, row) =>
  [0, 90, 180, 270].map((pcbRotation, column) => ({
    name: `U${row * 4 + column + 1}`,
    layer,
    pcbRotation,
    pcbX: column * 8 - 10,
    pcbY: row === 0 ? 3 : -5,
  })),
)

beforeAll(async () => {
  circuit.add(
    <board width={36} height={24} routingDisabled>
      <pcbnotetext text="Polygon pad rotation" pcbY={10} fontSize={0.9} />
      <pcbnotetext
        text="Copper should fit inside the outline"
        pcbY={8.5}
        fontSize={0.6}
      />
      <pcbnotetext text="Top" pcbX={-15} pcbY={3} fontSize={0.7} />
      <pcbnotetext text="Bottom" pcbX={-15} pcbY={-5} fontSize={0.7} />
      {placements.map((placement) => (
        <chip key={placement.name} {...placement} footprint={footprint} />
      ))}
      {placements.map(({ name, pcbRotation, pcbX, pcbY }) => (
        <Fragment key={name}>
          <pcbnotetext
            text={`${pcbRotation} deg`}
            pcbX={pcbX}
            pcbY={pcbY - 3.5}
            fontSize={0.7}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  // Keep snapshot failures outside the expected-failure test.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)

test("polygon plated holes retain rotation", () => {
  const platedHoles = circuit.db.pcb_plated_hole.list()
  const polygonPads = platedHoles.filter(
    (hole) => hole.shape === "hole_with_polygon_pad",
  )
  for (const polygonPad of polygonPads) {
    const outline = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === polygonPad.pcb_component_id)!
    const [start, end] = outline.route
    const outlineRotation =
      (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI
    expect((polygonPad.ccw_rotation ?? 0) % 180).toBeCloseTo(
      (outlineRotation + 360) % 180,
    )
  }

  const { circuit: importedCircuit } = getTestFixture()
  const importedFootprint = new Footprint({})
  importedFootprint.addAll(
    createComponentsFromCircuitJson(
      { componentName: "Imported", componentRotation: "0deg" },
      polygonPads,
    ),
  )
  const importedChip = new Chip({ name: "Imported" })
  importedChip.add(importedFootprint)
  const importedBoard = new Board({ width: 40, height: 28 })
  importedBoard.add(importedChip)
  importedCircuit.add(importedBoard)
  importedCircuit.render()
  expect(
    importedCircuit.db.pcb_plated_hole
      .list()
      .filter((hole) => hole.shape === "hole_with_polygon_pad")
      .map((hole) => hole.ccw_rotation),
  ).toEqual(polygonPads.map((hole) => hole.ccw_rotation))
})
