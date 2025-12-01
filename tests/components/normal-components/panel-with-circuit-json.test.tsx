import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbBoard } from "circuit-json"
import circuitJson from "../../fixtures/assets/R_0402_1005Metric.json"

test("panel with boards from circuitJson", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel tabWidth="0.4mm" tabLength="0.8mm" width="100mm" height="100mm">
      <board circuitJson={circuitJson as any} />
      <board circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list() as PcbBoard[]
  expect(boards.length).toBe(2)

  // All boards should have the same footprint
  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(2)

  const sourceComponent1 = circuit.db.source_component.get(
    pcbComponents[0].source_component_id!,
  )!
  const sourceComponent2 = circuit.db.source_component.get(
    pcbComponents[1].source_component_id!,
  )!

  expect(sourceComponent1.ftype).toBe(sourceComponent2.ftype)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("panel with boards from circuitJson with explicit positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel tabWidth="0.4mm" tabLength="0.8mm" width="100mm" height="100mm">
      <board pcbX={20} circuitJson={circuitJson as any} />
      <board pcbX={-20} circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list() as PcbBoard[]
  expect(boards.length).toBe(2)

  // All boards should have the same footprint
  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(2)

  const sourceComponent1 = circuit.db.source_component.get(
    pcbComponents[0].source_component_id!,
  )!
  const sourceComponent2 = circuit.db.source_component.get(
    pcbComponents[1].source_component_id!,
  )!

  expect(sourceComponent1.ftype).toBe(sourceComponent2.ftype)

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-explicit-positions")
})
