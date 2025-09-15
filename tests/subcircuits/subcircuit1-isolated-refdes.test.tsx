import { test, expect, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

describe("subcircuit1-isolated-refdes", () => {
  test("should NOT be able to connect traces without explicit subcircuit refdes", async () => {
    const { circuit } = await getTestFixture()

    circuit.add(
      <board>
        <subcircuit name="subcircuit1">
          <resistor name="R1" resistance="1k" />
        </subcircuit>
        <subcircuit name="subcircuit2">
          <resistor name="R2" resistance="1k" />
        </subcircuit>
        <trace from=".R1" to=".R2" />
      </board>,
    )

    const circuitJson = circuit.getCircuitJson()
    const errors = circuitJson.filter(
      (c: any) => c.type === "source_trace_not_connected_error",
    )

    expect(errors.length).toBe(1)
    expect((errors[0] as any).message).toContain(
      'Could not find port for selector ".R1"',
    )
  })

  test("should be able to connect traces with explicit subcircuit refdes", async () => {
    const { circuit } = await getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <subcircuit name="subcircuit1">
          <resistor name="R1" resistance="1k" />
        </subcircuit>
        <subcircuit name="subcircuit2">
          <resistor name="R2" resistance="1k" />
        </subcircuit>
        <trace from=".subcircuit1 .R1 .pin1" to=".subcircuit2 .R2 .pin1" />
      </board>,
    )

    expect(() => circuit.render()).not.toThrow()
  })
})
