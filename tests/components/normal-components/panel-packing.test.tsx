import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardOutline = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 15 },
  { x: 0, y: 15 },
]

const boardOutline2 = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 6, y: 12 },
]

const boardOutline3 = [
  { x: 15, y: 15 },
  { x: 25, y: 15 },
  { x: 20, y: 25 },
]

test("panel packing default", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid">
      <board width="10mm" height="10mm" routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0805" />
        <silkscreentext pcbX={0} pcbY={0} text="B1" anchorAlignment="center" />
        <fabricationnotetext text="text" pcbX={1} pcbY={1} />
      </board>
      <board width="12mm" height="8mm" routingDisabled>
        <resistor name="R1" resistance="1k" pcbY={2} footprint="0805" />
        <silkscreencircle pcbX={0} pcbY={-1} radius={1} />
        <fabricationnoterect
          pcbX={1}
          pcbY={1}
          width={2}
          height={2}
          color="blue"
          isFilled
        />
      </board>
      <board width="8mm" height="12mm" routingDisabled>
        <silkscreenrect pcbX={0} pcbY={0} width={2} height={2} />
        <fabricationnotepath
          route={[
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ]}
        />
      </board>
      <board width="10mm" height="10mm" routingDisabled>
        <silkscreenline x1={-2} y1={-2} x2={2} y2={2} strokeWidth={0.1} />
        <fabricationnotedimension from={{ x: -1, y: -1 }} to={{ x: 1, y: 1 }} />
      </board>
      <board width="5mm" height="5mm" routingDisabled>
        <silkscreenpath
          route={[
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: -1 },
          ]}
        />
        <fabricationnoterect
          pcbX={0}
          pcbY={0}
          width={1}
          height={1}
          strokeWidth={0.1}
        />
      </board>
      <board width="15mm" height="5mm" routingDisabled>
        <silkscreentext
          pcbX={0}
          pcbY={0}
          text="B6"
          fontSize="0.5mm"
          anchorAlignment="center"
        />
        <fabricationnotetext text="another text" pcbX={1} pcbY={1} />
      </board>
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(6)

  for (const board of boards) {
    expect(board.position_mode).toBe("relative_to_panel_anchor")
    expect(board).toHaveProperty("display_offset_x")
    expect(board).toHaveProperty("display_offset_y")
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-default")
})

test("panel packing with no board gap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" boardGap={0} edgePadding={0}>
      <board width="10mm" height="10mm" routingDisabled />
      <board width="12mm" height="8mm" routingDisabled />
      <board width="8mm" height="12mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="5mm" height="5mm" routingDisabled />
      <board width="15mm" height="5mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-gap")
})

test("panel packing with outline boards", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid">
      <board pcbX={4} name="B1" outline={boardOutline} routingDisabled />
      <board name="B2" outline={boardOutline2} routingDisabled />
      <board pcbY={20} name="B3" outline={boardOutline3} routingDisabled />
      <board name="B4" width="8mm" height="8mm" routingDisabled />
    </panel>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  const warnings = circuitJson.filter(
    (element) =>
      "error_type" in element &&
      element.error_type === "source_property_ignored_warning",
  )

  expect(warnings.length).toBe(2)
  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline")
})

test("panel packing with outline boards and no board gap", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" boardGap={0} edgePadding={0}>
      <board name="B1" outline={boardOutline} routingDisabled />
      <board name="B2" outline={boardOutline2} routingDisabled />
      <board name="B3" outline={boardOutline3} routingDisabled />
      <board name="B4" width="8mm" height="8mm" routingDisabled />
    </panel>,
  )

  circuit.render()
  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline-no-gap")
})

test("panel packing with rows and cols", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" row={1} col={5}>
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(5)
  const positions = boards.map((b) => b.center)

  // All should have same y
  const firstY = positions[0].y
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i].y).toBe(firstY)
  }

  // X should be increasing
  for (let i = 0; i < positions.length - 1; i++) {
    expect(positions[i].x).toBeLessThan(positions[i + 1].x)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-rows-cols")
})

test("panel packing with cellWidth and cellHeight", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" cellWidth="20mm" cellHeight="20mm">
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-cell-dims")
})

test("panel packing with small cellWidth/cellHeight", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" cellWidth="5mm" cellHeight="5mm">
      <board width="10mm" height="10mm" routingDisabled />
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )
  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-small-cell-dims")
})
