import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test } from "bun:test"
import { expect } from "bun:test"
test("repro-12: same name of components in subcircuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group subcircuit>
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX={-3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </group>,
  )

  await circuit.renderUntilSettled()

  const pcb_trace_errors = circuit.db.pcb_trace_error.list()
  expect(pcb_trace_errors).toHaveLength(1)
})

test("repro-12: same name of components in board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX={-3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_trace_errors = circuit.db.pcb_trace_error.list()
  expect(pcb_trace_errors).toHaveLength(1)
})

test("repro-12: same name of components in different subcircuits should not be an error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group>
      <group subcircuit>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".R1 > .pin1" to=".R1 > .pin1" />
      </group>
      <subcircuit>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={-3}
          pcbX={-3}
        />
      </subcircuit>
    </group>,
  )

  await circuit.renderUntilSettled()

  // No errors because the components are in different subcircuits
  const pcb_trace_errors = circuit.db.pcb_trace_error.list()
  expect(pcb_trace_errors).toHaveLength(0)
})
