import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("inflated chips infer pins without schematic component metadata", async () => {
  const renderedCircuitJson = await renderToCircuitJson(
    <board width="18mm" height="12mm">
      <chip
        name="U1"
        pinLabels={{ pin1: "IN", pin2: "OUT" }}
        footprint="soic2"
        pcbX={-2}
      />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={3} />
      <trace from=".U1 > .OUT" to=".R1 > .pin1" />
    </board>,
  )
  const importedCircuitJson = renderedCircuitJson.filter(
    (element) => element.type !== "schematic_component",
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="24mm" height="16mm">
      <subcircuit name="IMPORTED" circuitJson={importedCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_port
      .list()
      .filter(
        (sourcePort) =>
          sourcePort.source_component_id ===
          circuit.db.source_component.getWhere({ name: "U1" })
            ?.source_component_id,
      )
      .map((sourcePort) => sourcePort.name),
  ).toEqual(expect.arrayContaining(["IN", "OUT"]))
  expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
