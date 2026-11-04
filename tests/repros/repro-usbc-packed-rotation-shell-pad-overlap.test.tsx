import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948-pill-shell.circuit.json"

// The pack layout turns J1 a quarter turn to face U2. The SHELL plated holes
// are 1.2 x 2.0mm pills next to the GND pads; if their rotation is not updated
// with the component they overlap GND1/GND2 and the placement error blocks
// autorouting for the whole board.
test("usb_c shell pills rotate with a pack-rotated connector", async () => {
  const { circuit } = getTestFixture()
  const partsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: async ({ supplierPartNumber }) =>
      supplierPartNumber === "C165948"
        ? (structuredClone(usbCC165948CircuitJson) as AnyCircuitElement[])
        : undefined,
  }

  circuit.add(
    <board width="30mm" height="30mm" partsEngine={partsEngine}>
      <connector
        name="J1"
        standard="usb_c"
        supplierPartNumbers={{ jlcpcb: ["C165948"] }}
        connections={{
          VBUS1: "net.V5",
          VBUS2: "net.V5",
          GND1: "net.GND",
          GND2: "net.GND",
        }}
      />
      <chip
        name="U2"
        footprint="dip20"
        connections={{ pin5: "net.V5", pin6: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const j1 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "J1",
    )!
  const j1Rotation = ((j1.rotation % 360) + 360) % 360
  // Guard: this repro only means something if the packer rotated J1.
  expect(Math.round(j1Rotation)).toBe(270)

  const shellHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((h) => h.pcb_component_id === j1.pcb_component_id)
  expect(shellHoles).toHaveLength(4)
  for (const hole of shellHoles) {
    expect(hole.shape).toBe("pill")
    expect((hole as any).ccw_rotation).toBeCloseTo(270, 6)
  }

  expect(circuit.db.pcb_pad_pad_clearance_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})
