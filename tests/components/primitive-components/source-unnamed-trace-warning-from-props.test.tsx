import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces synthesized from component props do not emit source_unnamed_trace_warning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        externallyConnectedPins={[["pin1", "pin2"]]}
        connections={{ pin3: ".R2 > .pin1" }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pullupFor=".U1 > .pin4"
        pullupTo=".U1 > .pin8"
      />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        decouplingFor=".U1 > .pin8"
        decouplingTo=".U1 > .pin5"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list().length).toBeGreaterThanOrEqual(5)
  expect(circuit.db.source_unnamed_trace_warning.list()).toHaveLength(0)
})
