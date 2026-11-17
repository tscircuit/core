import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"

test("authored port children prevent supplier polarity adoption even when deduplicated", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: () => ({ jlcpcb: ["C3030991"] }),
        fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <led name="D1" footprint="0603" color="red">
        <port pinNumber={1} name="anode" />
        <port pinNumber={2} name="cathode" />
      </led>
    </board>,
  )
  await circuit.renderUntilSettled()
  const led = circuit.selectOne(".D1") as Led
  expect(led.anode.props.pinNumber).toBe(1)
  expect(led.cathode.props.pinNumber).toBe(2)
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(1)
})
