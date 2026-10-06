import { expect, test } from "bun:test"
import { source_component_availability_warning } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when no JLC alternative has confirmed stock and shares concurrent checks", async () => {
  const calls: string[] = []
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      platformFetch: (async (url, options) => {
        const partNumber = new URL(String(url)).searchParams.get("q")!
        calls.push(partNumber)
        expect(options?.cache).toBe("no-store")
        expect(options?.signal).toBeDefined()
        await Promise.resolve()
        const lcsc = Number(partNumber.slice(1))
        if (lcsc === 3) return Response.json({ components: [] })
        if (lcsc === 4)
          return Response.json({ components: [{ lcsc: 999, stock: 100 }] })
        return Response.json({
          components: [{ lcsc, stock: lcsc === 2 ? 100 : 0 }],
        })
      }) as typeof fetch,
    },
  })
  circuit.add(
    <board routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1", "1", " c1 "] }}
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
        supplierPartNumbers={{ jlcpcb: ["C4"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(calls.sort()).toEqual(["C1", "C2", "C3", "C4"])
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
  await circuit.renderUntilSettled()
  expect(calls).toHaveLength(4)
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    3,
  )
})
