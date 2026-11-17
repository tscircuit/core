import { expect, test } from "bun:test"
import { Led } from "lib/components/normal-components/Led"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("slow supplier lookup times out and keeps the default LED polarity", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, Led.supplierPolarityTimeoutMs + 300),
          )
          return { jlcpcb: ["C3030991"] }
        },
        fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
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
  // The late supplier result still reaches the mismatch check.
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(1)
}, 10_000)
