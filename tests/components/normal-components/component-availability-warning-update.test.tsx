import { expect, test } from "bun:test"
import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier updates discard stale lookups and clear outdated availability warnings", async () => {
  const requests: {
    partNumber: string
    resolve: (availability: {
      stock: number
      price: number | null
      currency: string | null
    }) => void
  }[] = []
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      partsEngine: {
        findPart: () => ({}),
        fetchPartAvailability: ({ supplierPartNumber }) =>
          new Promise((resolve) => {
            requests.push({ partNumber: supplierPartNumber, resolve })
          }),
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1"] }}
      />
    </board>,
  )
  circuit.render()
  await Promise.resolve()
  const resistor = circuit.selectOne(".R1") as NormalComponent
  circuit.db.source_component.update(resistor.source_component_id!, {
    supplier_part_numbers: { jlcpcb: ["C2"] },
  })
  resistor.updateComponentAvailabilityWarning()
  await Promise.resolve()
  expect(requests.map((request) => request.partNumber)).toEqual(["C1", "C2"])
  requests[0].resolve({ stock: 0, price: null, currency: null })
  requests[1].resolve({ stock: 100, price: null, currency: null })
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    0,
  )

  resistor.updateComponentAvailabilityWarning()
  await Promise.resolve()
  requests[2].resolve({ stock: 0, price: null, currency: null })
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    1,
  )
  circuit.setPlatform({ checkAvailability: false })
  resistor.updateComponentAvailabilityWarning()
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    0,
  )
  expect(requests).toHaveLength(3)
})
