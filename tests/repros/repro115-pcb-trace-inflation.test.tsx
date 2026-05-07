import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro115: pcb trace inflation missing", async () => {
  const { circuit: sourceCircuit } = getTestFixture()
  sourceCircuit.add(
    <group name="G1">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </group>,
  )
  await sourceCircuit.renderUntilSettled()

  const subcircuitCircuitJson = sourceCircuit.getCircuitJson()
  const sourcePcbTraces = sourceCircuit.db.pcb_trace.list()
  expect(sourcePcbTraces).toHaveLength(1)

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)
  expect(pcbTraces[0].route).toEqual(sourcePcbTraces[0].route)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
