import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "inductor throws validation error on invalid inductance string (#3114)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <inductor
          name="L1"
          inductance="invalid"
          footprint="axial_p0.3in"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    expect(() => circuit.render()).toThrow(
      /Invalid inductance for inductor "L1": "invalid"/,
    )
  },
  { timeout: 30000 },
)

test(
  "inductor parses valid SI inductance string to numeric henries",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
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
