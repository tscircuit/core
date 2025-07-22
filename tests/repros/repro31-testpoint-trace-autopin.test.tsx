import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/** Reproduction for selecting a testpoint by refdes when tracing */
test("trace connects to testpoint refdes", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" />
      <trace from="TP1" to="net.GND" />
    </board>,
  )

  expect(() => circuit.render()).not.toThrow()
})
