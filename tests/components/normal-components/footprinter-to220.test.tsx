import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprinter: to220 with 3 holes", () => {
    const { circuit } = getTestFixture()
  
    circuit.add(
      <board
        width="30mm"
        height="10mm"
      >
        <chip footprint="to220_3" name="U3" />
      </board>,
    ) 
  
    circuit.render()

    const pcb_plated_holes = circuit.db.pcb_plated_hole.list()
    expect(pcb_plated_holes).toHaveLength(3)
  
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })