import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit circuit JSON inflates simple_test_point components", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="12mm" height="10mm">
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="rect"
        width="2mm"
        height="1.2mm"
      />
    </board>,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="18mm" height="14mm">
      <subcircuit name="IMPORTED" circuitJson={subcircuitCircuitJson} />
      <pcbnotetext
        text="Imported simple_test_point"
        pcbX={0}
        pcbY={5}
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.getWhere({ name: "TP1" })).toMatchObject({
    ftype: "simple_test_point",
    footprint_variant: "pad",
    pad_shape: "rect",
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
