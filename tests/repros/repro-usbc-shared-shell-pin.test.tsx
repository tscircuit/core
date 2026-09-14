import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import sharedShellPinCircuitJson from "tests/fixtures/assets/usb-c-shared-shell-pin.circuit.json"

// A fetched USB-C part whose four shell holes share only two distinct pin
// numbers (both left holes are pin13, both right holes are pin14). The
// standardizer must still give every hole its own SHELL label and pin so each
// shell pad resolves to its own pcb_port instead of an ambiguous reference.
test("usb_c shell holes sharing a pin number each get a pcb_port", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }: any) =>
      sourceComponent.ftype === "simple_connector" &&
      sourceComponent.standard === "usb_c"
        ? { jlcpcb: ["CSHARED"] }
        : {},
    fetchPartCircuitJson: async ({ supplierPartNumber }: any) =>
      supplierPartNumber === "CSHARED"
        ? (sharedShellPinCircuitJson as AnyCircuitElement[])
        : undefined,
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)

  // All four shell holes sit at x = +/-4.32 and must each resolve to a pcb_port.
  const shellHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((hole: any) => Math.abs(Math.abs(hole.x) - 4.32) < 0.01)
  expect(shellHoles).toHaveLength(4)
  for (const hole of shellHoles) {
    expect((hole as any).pcb_port_id).toBeTruthy()
  }
})
