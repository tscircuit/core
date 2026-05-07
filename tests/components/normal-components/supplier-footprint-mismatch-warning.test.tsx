import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits supplier footprint mismatch warning for mismatched supplier footprint dimensions", async () => {
  const { circuit } = getTestFixture()
  const fetchCalls: Array<{ supplierPartNumber?: string }> = []
  const supplierFootprint = fp
    .string("0603")
    .circuitJson() as AnyCircuitElement[]

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C0603"] }),
    fetchPartCircuitJson: async ({ supplierPartNumber }) => {
      fetchCalls.push({ supplierPartNumber })
      return supplierFootprint
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit.db.supplier_footprint_mismatch_warning.list()
  expect(fetchCalls).toEqual([{ supplierPartNumber: "C0603" }])
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    type: "supplier_footprint_mismatch_warning",
    warning_type: "supplier_footprint_mismatch_warning",
    supplier_name: "jlcpcb",
    supplier_part_number: "C0603",
    source_component_id:
      circuit.db.source_component.list()[0].source_component_id,
    pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
  })
  expect(warnings[0].message).toContain("R1")
  expect(warnings[0].message).toContain('"res0402"')
  expect(warnings[0].footprint_copper_intersection_over_union).toBeLessThan(0.8)
})
