import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"

test("unnamed plain <led footprint='0603' color='red' /> builds without polarity errors", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C3030991"] }),
    fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine },
  })

  const unnamedLedProps = { footprint: "0603", color: "red" } as any
  circuit.add(
    <board width="12mm" height="8mm">
      <led {...unnamedLedProps} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
})
