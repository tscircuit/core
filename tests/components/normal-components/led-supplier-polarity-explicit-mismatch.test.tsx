import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"

test("explicit LED polarity via pinLabels or footprint options still reports supplier polarity mismatches", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C3030991"] }),
    fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <led
        name="LED_PINLABELS"
        color="red"
        footprint="0603"
        pcbX={-4}
        pinLabels={{ pin1: ["anode", "pos"], pin2: ["cathode", "neg"] }}
      />
      <led
        name="LED_FOOTPRINT"
        color="red"
        footprint="led0603_anodepin1_cathodepin2"
        pcbX={4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors).toHaveLength(2)
})
