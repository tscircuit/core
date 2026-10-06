import { expect, test } from "bun:test"
import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier updates discard stale lookups and clear outdated availability warnings", async () => {
  const requests: {
    partNumber: string
    resolve: (response: Response) => void
  }[] = []
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      platformFetch: ((url) =>
        new Promise<Response>((resolve) => {
          requests.push({
            partNumber: new URL(String(url)).searchParams.get("q")!,
            resolve,
          })
        })) as typeof fetch,
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
  const resistor = circuit.selectOne(".R1") as NormalComponent
  circuit.db.source_component.update(resistor.source_component_id!, {
    supplier_part_numbers: { jlcpcb: ["C2"] },
  })
  resistor.updateComponentAvailabilityWarning()
  expect(requests.map((request) => request.partNumber)).toEqual(["C1", "C2"])
  requests[0].resolve(Response.json({ components: [{ lcsc: 1, stock: 0 }] }))
  requests[1].resolve(Response.json({ components: [{ lcsc: 2, stock: 100 }] }))
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    0,
  )

  resistor.updateComponentAvailabilityWarning()
  requests[2].resolve(Response.json({ components: [{ lcsc: 2, stock: 0 }] }))
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
