import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unknown supplier polarities preserve the default mapping", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: () => ({ jlcpcb: ["C3030991"], mouser: ["OTHER"] }),
        fetchPartCircuitJson: () => createSupplierLedCircuitJson("unknown"),
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <led name="D1" footprint="0603" color="red" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const led = circuit.selectOne(".D1") as Led
  expect(led.anode.props.pinNumber).toBe(1)
  expect(led.cathode.props.pinNumber).toBe(2)
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(0)
})
