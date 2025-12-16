import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbCutout, PcbHole, PcbBoard } from "circuit-json"

test("panels boards with manual positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" panelizationMethod="tab-routing">
      <board
        width="30mm"
        height="30mm"
        pcbX="-20mm"
        pcbY="-20mm"
        routingDisabled
      />
      <board
        width="30mm"
        height="30mm"
        pcbX="20mm"
        pcbY="20mm"
        routingDisabled
      />
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const tabCutouts = circuitJson.filter(
    (el) => el.type === "pcb_cutout",
  ) as PcbCutout[]
  expect(tabCutouts.length).toBeGreaterThan(0)

  const mouseBiteHoles = circuitJson.filter(
    (el) => el.type === "pcb_hole",
  ) as PcbHole[]
  expect(mouseBiteHoles.length).toBeGreaterThanOrEqual(0)

  const boards = circuitJson.filter(
    (el) => el.type === "pcb_board",
  ) as PcbBoard[]
  expect(boards.length).toBe(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-with-positions")
})

test("panel boards with no positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" panelizationMethod="tab-routing">
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-positions")
})

test("panel boards with no positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="120mm" panelizationMethod="tab-routing">
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-no-positions-5-boards",
  )
})

test("panel boards with some positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" panelizationMethod="tab-routing">
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" pcbX={-30} routingDisabled />
      <board width="20mm" height="50mm" pcbX={30} routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-some-positions")
})

test("panel with mixed positions doesn't autolayout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" panelizationMethod="tab-routing">
      <board width="20mm" height="50mm" routingDisabled />
      <board width="20mm" height="50mm" pcbX={30} routingDisabled />
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  // Unpositioned board should be at 0,0
  expect(boards.find((b) => b.center.x === 0)).toBeDefined()
  // Positioned board should be at 30,0
  expect(boards.find((b) => b.center.x === 30)).toBeDefined()

  const panel = circuit.db.pcb_panel.list()[0]
  // Panel should not be resized
  expect(panel.width).toBe(100)
  expect(panel.height).toBe(100)
})

test("panel with panelizationMethod: 'none' has no tabs or mouse bites", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" panelizationMethod="none">
      <board width="30mm" height="30mm" routingDisabled />
      <board width="30mm" height="30mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const tabCutouts = circuitJson.filter((el) => el.type === "pcb_cutout")
  expect(tabCutouts.length).toBe(0)
  const mouseBiteHoles = circuitJson.filter((el) => el.type === "pcb_hole")
  expect(mouseBiteHoles.length).toBe(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-tabs")
})

test("panel with mouseBites: false has no mouse bites", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="100mm"
      height="100mm"
      panelizationMethod="tab-routing"
      mouseBites={false}
    >
      <board
        width="30mm"
        height="30mm"
        pcbX="-20mm"
        pcbY="-20mm"
        routingDisabled
      />
      <board
        width="30mm"
        height="30mm"
        pcbX="20mm"
        pcbY="20mm"
        routingDisabled
      />
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const tabCutouts = circuitJson.filter((el) => el.type === "pcb_cutout")
  expect(tabCutouts.length).toBeGreaterThan(0)
  const mouseBiteHoles = circuitJson.filter((el) => el.type === "pcb_hole")
  expect(mouseBiteHoles.length).toBe(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-no-mouse-bites")
})

test("panel custom tab/gap props", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="100mm"
      height="100mm"
      panelizationMethod="tab-routing"
      boardGap="5mm"
      tabLength="2mm"
      tabWidth="0.5mm"
    >
      <board width="30mm" height="30mm" routingDisabled />
      <board width="30mm" height="30mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-custom-props")
})

test("panel with boards with different outlines", () => {
  const { circuit } = getTestFixture()

  // 4x2 grid of boards
  const board1_outline = [
    // Pentagon
    { x: -70, y: -30 },
    { x: -50, y: -30 },
    { x: -50, y: -15 },
    { x: -60, y: -10 },
    { x: -70, y: -15 },
  ]
  const board2_outline = [
    // Rhombus
    { x: 20, y: -30 },
    { x: 30, y: -20 },
    { x: 20, y: -10 },
    { x: 10, y: -20 },
  ]
  const board3_outline = [
    // C-Shape
    { x: -30, y: 10 },
    { x: -10, y: 10 },
    { x: -10, y: 15 },
    { x: -25, y: 15 },
    { x: -25, y: 25 },
    { x: -10, y: 25 },
    { x: -10, y: 30 },
    { x: -30, y: 30 },
  ]
  const board4_outline = [
    // Octagon
    { x: 55, y: 10 },
    { x: 65, y: 10 },
    { x: 70, y: 15 },
    { x: 70, y: 25 },
    { x: 65, y: 30 },
    { x: 55, y: 30 },
    { x: 50, y: 25 },
    { x: 50, y: 15 },
  ]
  const board5_outline = [
    // Hexagon
    { x: -50, y: 20 },
    { x: -55, y: 28.7 },
    { x: -65, y: 28.7 },
    { x: -70, y: 20 },
    { x: -65, y: 11.3 },
    { x: -55, y: 11.3 },
  ]
  const board6_outline = [
    // T-shape
    { x: -30, y: -15 },
    { x: -22.5, y: -15 },
    { x: -22.5, y: -30 },
    { x: -17.5, y: -30 },
    { x: -17.5, y: -15 },
    { x: -10, y: -15 },
    { x: -10, y: -10 },
    { x: -30, y: -10 },
  ]
  const board7_outline = [
    // U-shape
    { x: 10, y: 30 },
    { x: 30, y: 30 },
    { x: 30, y: 10 },
    { x: 25, y: 10 },
    { x: 25, y: 25 },
    { x: 15, y: 25 },
    { x: 15, y: 10 },
    { x: 10, y: 10 },
  ]
  const board8_outline = [
    // Plus-shape
    { x: 57.5, y: -10 },
    { x: 62.5, y: -10 },
    { x: 62.5, y: -17.5 },
    { x: 70, y: -17.5 },
    { x: 70, y: -22.5 },
    { x: 62.5, y: -22.5 },
    { x: 62.5, y: -30 },
    { x: 57.5, y: -30 },
    { x: 57.5, y: -22.5 },
    { x: 50, y: -22.5 },
    { x: 50, y: -17.5 },
    { x: 57.5, y: -17.5 },
  ]

  circuit.add(
    <panel panelizationMethod="tab-routing" row={2} boardGap={10}>
      <board outline={board1_outline} routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>
      <board outline={board2_outline} routingDisabled>
        <resistor name="R2" resistance="1k" footprint="0805" />
      </board>
      <board outline={board3_outline} routingDisabled>
        <resistor name="R3" resistance="1k" footprint="0805" pcbY={7} />
      </board>
      <board outline={board4_outline} routingDisabled>
        <resistor name="R4" resistance="1k" footprint="0805" />
      </board>
      <board outline={board5_outline} routingDisabled>
        <resistor name="R5" resistance="1k" footprint="0805" />
      </board>
      <board outline={board6_outline} routingDisabled>
        <resistor name="R6" resistance="1k" footprint="0805" />
      </board>
      <board outline={board7_outline} routingDisabled>
        <resistor name="R7" resistance="1k" footprint="0805" pcbY={7} />
      </board>
      <board outline={board8_outline} routingDisabled>
        <resistor name="R8" resistance="1k" footprint="0805" />
      </board>
    </panel>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-with-outlines")
})
