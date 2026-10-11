import { expect, test } from "bun:test"
import { source_component_availability_warning } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("checks supplier alternatives through the engine and shares concurrent requests", async () => {
  const calls: string[] = []
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      platformFetch: Object.assign(
        async () => {
          throw new Error("Core must not fetch directly")
        },
        { preconnect: () => {} },
      ),
      partsEngine: {
        findPart: () => ({}),
        fetchPartAvailability: async ({
          supplierName,
          supplierPartNumber,
          signal,
          platformFetch,
        }) => {
          calls.push(`${supplierName}:${supplierPartNumber}`)
          expect(signal).toBeDefined()
          expect(platformFetch).toBe(circuit.platform?.platformFetch)
          await Promise.resolve()
          if (supplierName === "lcsc") return undefined
          return {
            stock:
              supplierPartNumber === "C2"
                ? 100
                : supplierPartNumber === "C3"
                  ? null
                  : 0,
            price: 0.006,
            currency: "USD",
          }
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1", "C1", " C1 "] }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1", "C2"] }}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C3"] }}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ digikey: ["123-ND"] }}
      />
      <resistor
        name="R5"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ lcsc: ["C5"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(calls.sort()).toEqual([
    "digikey:123-ND",
    "jlcpcb:C1",
    "jlcpcb:C2",
    "jlcpcb:C3",
    "lcsc:C5",
  ])
  const warnings = circuit.db.source_component_availability_warning.list()
  expect(warnings).toHaveLength(3)
  expect(
    warnings
      .map(
        (warning) =>
          circuit.db.source_component.get(warning.source_component_id)?.name,
      )
      .sort(),
  ).toEqual(["R1", "R3", "R4"])
  for (const warning of warnings) {
    expect(
      source_component_availability_warning.safeParse(warning).success,
    ).toBe(true)
    expect(warning.message).toContain("may not have availability")
    expect(warning.message).not.toContain(warning.source_component_id)
  }
  expect(
    warnings.find((warning) => warning.message.startsWith("R1"))
      ?.supplier_part_numbers,
  ).toEqual(["C1"])
  expect(
    warnings.find((warning) => warning.message.startsWith("R4"))?.supplier_name,
  ).toBe("digikey")
  await circuit.renderUntilSettled()
  expect(calls).toHaveLength(5)
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    3,
  )
})
