import { test, expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multi-pin components do not imply pin1 in trace selectors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint name="TP1" footprintVariant="pad" />
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from="R1" to="TP1" />
    </board>,
  )

  const errors = circuit
    .getCircuitJson()
    .filter(
      (c: AnyCircuitElement) => c.type === "source_trace_not_connected_error",
    )

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toMatchInlineSnapshot(
    `"Could not find port for selector \"R1\""`,
  )
})
