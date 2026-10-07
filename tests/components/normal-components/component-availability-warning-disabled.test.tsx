import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("availability defaults off and skips unsupported engines, unassembled and disabled parts", async () => {
  for (const checkAvailability of [undefined, false, true]) {
    let calls = 0
    const { circuit } = getTestFixture({
      platform: {
        checkAvailability,
        partsEngine: {
          findPart: () => ({}),
          fetchPartAvailability: async () => {
            calls++
            throw new Error("No lookup expected")
          },
        },
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
          supplierPartNumbers={{ jlcpcb: [" "] }}
        />
        <group name="no-bom" subcircuit bomDisabled>
          <resistor
            name="R4"
            resistance="1k"
            footprint="0402"
            supplierPartNumbers={{ jlcpcb: ["C4"] }}
          />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(calls).toBe(0)
    expect(
      circuit.db.source_component_availability_warning.list(),
    ).toHaveLength(0)
  }
  for (const platform of [
    { checkAvailability: true },
    { checkAvailability: true, partsEngine: { findPart: () => ({}) } },
    {
      checkAvailability: true,
      partsEngineDisabled: true,
      partsEngine: {
        findPart: () => ({}),
        fetchPartAvailability: async () => {
          throw new Error("No lookup expected")
        },
      },
    },
    {
      checkAvailability: true,
      drcChecksDisabled: true,
      partsEngine: {
        findPart: () => ({}),
        fetchPartAvailability: async () => {
          throw new Error("No lookup expected")
        },
      },
    },
  ]) {
    const { circuit } = getTestFixture({ platform })
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
    expect(
      circuit.db.source_component_availability_warning.list(),
    ).toHaveLength(0)
  }
})
