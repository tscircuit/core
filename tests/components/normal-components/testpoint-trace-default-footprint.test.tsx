import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A trace routing to a <testpoint /> that relies on its default (implied)
 * footprint should not throw "does not have a footprint" during PCB render.
 */
test("trace to testpoint with default footprint does not throw", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board autorouter="sequential-trace">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <testpoint name="TP1" />
      <trace from=".R1 > .pin1" to="net.TP" />
      <trace from=".TP1 > .pin1" to="net.TP" />
    </board>,
  )

  expect(() => circuit.render()).not.toThrow()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])
})
