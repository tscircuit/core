import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("availability checks default off and skip unassembled, BOM-disabled, and non-JLC parts", async () => {
  for (const checkAvailability of [undefined, false, true]) {
    const calls: string[] = []
    const { circuit } = getTestFixture({
      platform: {
        checkAvailability,
        platformFetch: (async (url: Parameters<typeof fetch>[0]) => {
          calls.push(String(url))
          throw new Error("No lookup expected")
        }) as unknown as typeof fetch,
      },
    })
    circuit.add(
      <board routingDisabled>
        {checkAvailability !== true && (
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            supplierPartNumbers={{ jlcpcb: ["C1"] }}
          />
        )}
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          doNotPlace
          supplierPartNumbers={{ jlcpcb: ["C2"] }}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          supplierPartNumbers={{ lcsc: ["C3"] }}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          supplierPartNumbers={{ jlcpcb: [" "] }}
        />
        <group name="no-bom" subcircuit bomDisabled>
          <resistor
            name="R5"
            resistance="1k"
            footprint="0402"
            supplierPartNumbers={{ jlcpcb: ["C5"] }}
          />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(calls).toEqual([])
    expect(
      circuit.db.source_component_availability_warning.list(),
    ).toHaveLength(0)
  }
  const { circuit } = getTestFixture({
    platform: {
      checkAvailability: true,
      drcChecksDisabled: true,
      platformFetch: (async () => {
        throw new Error("No lookup expected")
      }) as unknown as typeof fetch,
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
  await circuit.renderUntilSettled()
  expect(circuit.db.source_component_availability_warning.list()).toHaveLength(
    0,
  )
})
