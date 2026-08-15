import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "<inductor /> component",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="12mm" height="10mm">
        <inductor
          name="U1"
          inductance="10"
          maxCurrentRating="2A"
          footprint="axial_p0.3in"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    expect(
      circuit.db.source_component.getWhere({ name: "U1" }),
    ).toMatchObject({
      ftype: "simple_inductor",
      inductance: 10,
      max_current_rating: 2,
    })

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
  { timeout: 30000 },
)

test(
  "<inductor /> with unit string parses inductance to numeric henries (#3111)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="12mm" height="10mm">
        <inductor
          name="L1"
          inductance="10uH"
          footprint="axial_p0.3in"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    const sourceComp = circuit.db.source_component.getWhere({ name: "L1" })!
    expect(sourceComp.ftype).toBe("simple_inductor")
    expect(sourceComp.inductance).toBeCloseTo(10e-6, 8)
    expect(sourceComp.display_inductance).toBe("10µH")
  },
  { timeout: 30000 },
)
