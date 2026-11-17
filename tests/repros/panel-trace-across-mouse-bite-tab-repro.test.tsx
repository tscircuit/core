import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// An autorouted panel trace from B1's R1 to B2's R2 must cross the tab
// between the boards. On these small boards the tab's mouse-bite drills leave
// no legal gap, so the autorouter's best route runs into the drills.
test("autorouted panel trace crosses a mouse-bite tab between two boards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" col={2} panelizationMethod="tab-routing">
      <board name="B1" width={6} height={6}>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>
      <board name="B2" width={6} height={6}>
        <resistor name="R2" resistance="1k" footprint="0805" />
      </board>
      <trace from=".B1 .R1 .pin2" to=".B2 .R2 .pin1" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    [
      ...circuit.db.pcb_autorouting_error.list(),
      ...circuit.db.pcb_trace_error.list(),
      ...circuit.db.pcb_placement_error.list(),
    ].map((error) => error.message),
  ).toMatchInlineSnapshot(`
    [
      "PCB trace .B1 .R1 .pin2 to .B2 .R2 .pin1 overlaps with pcb_hole "unnamed hole" (accidental contact)",
      "PCB trace .B1 .R1 .pin2 to .B2 .R2 .pin1 overlaps with pcb_hole "unnamed hole" (accidental contact)",
      "PCB trace .B1 .R1 .pin2 to .B2 .R2 .pin1 overlaps with pcb_hole "unnamed hole" (accidental contact)",
      "PCB trace .B1 .R1 .pin2 to .B2 .R2 .pin1 overlaps with pcb_hole "unnamed hole" (accidental contact)",
      "Trace .B1 .R1 .pin2 to .B2 .R2 .pin1 is too close to non-plated hole unnamed hole (gap: 0.190000mm, required: 0.2mm)",
      "Trace .B1 .R1 .pin2 to .B2 .R2 .pin1 is too close to non-plated hole unnamed hole (gap: 0.115103mm, required: 0.2mm)",
      "Trace .B1 .R1 .pin2 to .B2 .R2 .pin1 is too close to non-plated hole unnamed hole (gap: 0.030932mm, required: 0.2mm)",
      "Trace .B1 .R1 .pin2 to .B2 .R2 .pin1 is too close to non-plated hole unnamed hole (gap: 0.190000mm, required: 0.2mm)",
      "Copper for .B1 .R1 .pin2 to .B2 .R2 .pin1 violates clearance to cutout unnamed cutout (measured 0.074mm, required 0.200mm)",
    ]
  `)
})
