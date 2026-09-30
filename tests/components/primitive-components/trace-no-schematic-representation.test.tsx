import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a physical-only trace omits its schematic representation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        schX={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} schX={0} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={5} schX={4} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        sourceTraceId="source_trace_schematic"
      />
      <trace
        from=".R2 > .pin1"
        to=".R3 > .pin1"
        noSchematicRepresentation
        sourceTraceId="source_trace_physical_only"
      />
      <pcbnotetext text="Physical-only trace" pcbY={3} fontSize={0.7} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSourceTrace = circuit.db.source_trace.get(
    "source_trace_schematic",
  )
  const physicalOnlySourceTrace = circuit.db.source_trace.get(
    "source_trace_physical_only",
  )

  expect(circuit.db.source_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.schematic_trace.list()).not.toHaveLength(0)
  expect(
    circuit.db.schematic_trace
      .list()
      .some((trace) => trace.source_trace_id === "source_trace_physical_only"),
  ).toBeFalse()
  expect(schematicSourceTrace?.subcircuit_connectivity_map_key).toBeDefined()
  expect(
    physicalOnlySourceTrace?.subcircuit_connectivity_map_key,
  ).toBeUndefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
