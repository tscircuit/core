import { expect, test } from "bun:test"
import { getCanonicalSupplierOrientationBoard } from "tests/fixtures/canonical-supplier-orientation-board"

test.failing(
  "recovers the same authored and real supplier frames on both sides at every quarter turn",
  async () => {
    const circuit = await getCanonicalSupplierOrientationBoard()
    const components = circuit.db.pcb_component.list()
    expect(components).toHaveLength(8)
    for (const pcb of components) {
      expect(pcb).toMatchObject({
        pin1_location: "leftside_top",
        supplier_pin1_location_map: { jlcpcb: "rightside_bottom" },
      })
      // The catalog snapshot supplies CAD geometry only. Unknown factory zero
      // must not turn into an invented numeric offset, including zero.
      expect(pcb).not.toHaveProperty("supplier_assembly_rotation_offset_map")
    }
  },
)
