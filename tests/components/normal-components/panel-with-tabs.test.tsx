import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbCutout, PcbHole, PcbBoard } from "circuit-json"

test("panels boards with manual positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
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
    <panel width="100mm" height="100mm">
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
    <panel width="100mm" height="100mm">
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
    <panel width="100mm" height="100mm">
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
    <panel width="100mm" height="100mm">
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
    <panel width="100mm" height="100mm" mouseBites={false}>
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

test("panel with subcircuits", () => {
  const { circuit: boardCircuit } = getTestFixture()
  boardCircuit.add(<board width="30mm" height="30mm" />)
  boardCircuit.render()
  const boardJson = boardCircuit.getCircuitJson()

  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subcircuit
        name="board1"
        circuitJson={boardJson}
        pcbX="-20mm"
        pcbY="-20mm"
        routingDisabled
      />
      <subcircuit
        name="board2"
        circuitJson={boardJson}
        pcbX="20mm"
        pcbY="20mm"
        routingDisabled
      />
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const boards = circuitJson.filter(
    (el) => el.type === "pcb_board",
  ) as PcbBoard[]
  expect(boards.length).toBe(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-with-subcircuits")
})
test("panel with subcircuits + auto-layout", () => {
  const { circuit: boardCircuit } = getTestFixture()
  boardCircuit.add(<board width="30mm" height="30mm" />)
  boardCircuit.render()
  const boardJson = boardCircuit.getCircuitJson()

  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subcircuit name="board1" circuitJson={boardJson} routingDisabled />
      <subcircuit name="board2" circuitJson={boardJson} routingDisabled />
    </panel>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const boards = circuitJson.filter(
    (el) => el.type === "pcb_board",
  ) as PcbBoard[]
  expect(boards.length).toBe(2)

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-with-subcircuits-auto-layout",
  )
})
