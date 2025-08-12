import { it, expect, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

describe("Resonator symbol variants (single snapshot)", () => {
  it("arranges all variants via schX/schY and renders once", async () => {
    const { circuit } = getTestFixture()

    const placements = [
      {
        name: "K1",
        frequency: "1MHz",
        loadCapacitance: "20pF",
        pinVariant: "no_ground" as const,
        schX: 0,
        schY: 0,
      },
      {
        name: "K2",
        frequency: "16MHz",
        loadCapacitance: "22pF",
        pinVariant: "ground_pin" as const,
        schX: 4,
        schY: 0,
      },
      {
        name: "K3",
        frequency: "32MHz",
        loadCapacitance: "18pF",
        pinVariant: "two_ground_pins" as const,
        schX: 0,
        schY: 3,
      },
      {
        // default (no pinVariant)
        name: "K4",
        frequency: "8MHz",
        loadCapacitance: "15pF",
        pinVariant: undefined,
        schX: 4,
        schY: 3,
      },
    ]

    circuit.add(
      <board width="10mm" height="10mm">
        {placements.map((p) => (
          <resonator
            key={p.name}
            name={p.name}
            frequency={p.frequency}
            loadCapacitance={p.loadCapacitance}
            pinVariant={p.pinVariant as any}
            schX={p.schX}
            schY={p.schY}
          />
        ))}
      </board>,
    )

    circuit.render()

    expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + "-resonator-symbols",
    )
  })
})
