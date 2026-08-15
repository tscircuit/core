import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "capacitor throws validation error on invalid capacitance string (#3110)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <capacitor
          name="C1"
          capacitance="invalid"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    expect(() => circuit.render()).toThrow(
      /Invalid capacitance for capacitor "C1": "invalid"/,
    )
  },
  { timeout: 30000 },
)

test(
  "capacitor renders valid capacitance without error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>,
    )

    circuit.render()

    const sourceComp = circuit.db.source_component.getWhere({ name: "C1" })!
    expect(sourceComp.ftype).toBe("simple_capacitor")
    expect(sourceComp.capacitance).toBeCloseTo(10e-6, 8)
  },
  { timeout: 30000 },
)
