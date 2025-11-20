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
