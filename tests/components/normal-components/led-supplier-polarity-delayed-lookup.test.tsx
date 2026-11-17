import { expect, test } from "bun:test"
import { Led } from "lib/components/normal-components/Led"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("slow supplier lookup adopts the same LED polarity as a fast lookup", async () => {
  let findPartCalls = 0
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: async () => {
          findPartCalls++
          await new Promise((resolve) => setTimeout(resolve, 2300))
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
  expect(findPartCalls).toBe(1)
  expect(led.anode.props.pinNumber).toBe(2)
  expect(led.cathode.props.pinNumber).toBe(1)
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(0)
}, 10_000)
