import { test, expect } from "bun:test"
import { Circuit } from "lib/index"

test("inductor with invalid inductance should throw a validation error, not produce NaNpH", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <inductor name="L1" footprint="0603" inductance="not-an-inductance" />
    </board>,
  )

  expect(() => circuit.render()).toThrow(/Invalid inductance/)
})

test("inductor with valid inductance does not throw", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <inductor name="L1" footprint="0603" inductance="1uH" />
    </board>,
  )

  expect(() => circuit.render()).not.toThrow()
})
