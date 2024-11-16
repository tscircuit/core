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

    expect(() => circuit.render()).toThrow(
      'Could not find port for selector ".R1"',
    )
  })

  test("should be able to connect traces with explicit subcircuit refdes", async () => {
    const { circuit } = await getTestFixture()

    circuit.add(
      <board>
        <subcircuit name="subcircuit1">
          <resistor name="R1" resistance="1k" />
        </subcircuit>
        <subcircuit name="subcircuit2">
          <resistor name="R2" resistance="1k" />
        </subcircuit>
        <trace from=".subcircuit1 .R1" to=".subcircuit2 .R2" />
      </board>,
    )

    expect(() => circuit.render()).not.toThrow()
  })
})
