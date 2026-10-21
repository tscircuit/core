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
      pcbX={-2.5}
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
    <platedhole
      portHints={["pin2"]}
      pcbX={2.5}
      shape="circular_hole_with_rect_pad"
      holeDiameter={0.8}
      rectPadWidth={4}
      rectPadHeight={2}
    />
  </footprint>
)
const placements = (["top", "bottom"] as const).flatMap((layer, row) =>
  [0, 90, 180, 270].map((pcbRotation, column) => ({
    name: `U${row * 4 + column + 1}`,
    layer,
    pcbRotation,
    pcbX: column * 10 - 15,
    pcbY: row === 0 ? 7 : -7,
  })),
)

beforeAll(async () => {
  circuit.add(
    <board width={40} height={28} routingDisabled>
      {placements.map((placement) => (
        <chip key={placement.name} {...placement} footprint={footprint} />
      ))}
      {placements.map(({ name, layer, pcbRotation, pcbX, pcbY }) => (
        <Fragment key={name}>
          <pcbnotetext
            text={`${name}: ${layer} ${pcbRotation} degrees`}
            pcbX={pcbX}
            pcbY={pcbY - 5}
            fontSize={0.5}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="Pin 1: polygon + offset drill. Pin 2: reference."
        pcbY={12.5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Keep snapshot failures outside the expected-failure test.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
}, 30_000)

test.failing("polygon plated holes retain rotation", () => {
  const platedHoles = circuit.db.pcb_plated_hole.list()
  const polygonPads = platedHoles.filter(
    (hole) => hole.shape === "hole_with_polygon_pad",
  )
  const rectanglePads = platedHoles.filter(
    (hole) => hole.shape === "circular_hole_with_rect_pad",
  )
  for (const polygonPad of polygonPads) {
    const rectanglePad = rectanglePads.find(
      (hole) => hole.pcb_component_id === polygonPad.pcb_component_id,
    )!
    expect(polygonPad.ccw_rotation).toBe(rectanglePad.rect_ccw_rotation)
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
