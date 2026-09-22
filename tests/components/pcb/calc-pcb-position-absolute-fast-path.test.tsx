import { expect, test } from "bun:test"
import { Board } from "lib"
import { Group_doInitialPcbCalcPlacementResolution } from "lib/components/primitive-components/Group/Group_doInitialPcbCalcPlacementResolution"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("absolute placements do not enumerate all pads to build calc variables", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled schematicDisabled>
      <resistor name="R1" footprint="0402" resistance="1k" pcbX={-3} />
      <resistor name="R2" footprint="0402" resistance="2k" pcbX={3} />
    </board>,
  )
  circuit.render()
  const board = circuit.firstChild as Board
  const before = JSON.stringify(circuit.getCircuitJson())
  const db = circuit.db
  const calls: string[] = []
  circuit.db = new Proxy(db, {
    get(target, key: keyof typeof db) {
      if (
        key === "pcb_smtpad" ||
        key === "pcb_plated_hole" ||
        key === "pcb_port"
      )
        calls.push(key)
      return target[key]
    },
  })
  try {
    Group_doInitialPcbCalcPlacementResolution(board)
    expect(calls).toEqual([])
    expect(JSON.stringify(circuit.getCircuitJson())).toBe(before)
  } finally {
    circuit.db = db
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
