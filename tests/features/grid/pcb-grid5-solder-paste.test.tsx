import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/core/issues/2897
// Grid layout moved pads but left pcb_solder_paste at pre-layout coordinates,
// putting stencil apertures millimeters away from their pads.
test("pcb-grid solder paste follows pads (#2897)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <group pcbGrid pcbGridCols={2} pcbGridGap="5mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
        <resistor name="R3" resistance="1k" footprint="0402" />
        <resistor name="R4" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  const pastes = circuit.db.pcb_solder_paste.list()

  expect(pads.length).toBe(8)
  expect(pastes.length).toBe(8)

  for (const paste of pastes) {
    const pad = circuit.db.pcb_smtpad.get(paste.pcb_smtpad_id!)!
    expect(pad).toBeDefined()
    if (pad.shape === "circle" || paste.shape === "circle") continue
    expect(Math.abs((pad as any).x - (paste as any).x)).toBeLessThan(0.001)
    expect(Math.abs((pad as any).y - (paste as any).y)).toBeLessThan(0.001)
  }
})
