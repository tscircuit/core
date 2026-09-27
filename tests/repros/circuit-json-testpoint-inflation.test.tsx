import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("Circuit JSON inflation preserves a testpoint rendered from TSX", async () => {
  const sourceCircuitJson = await renderToCircuitJson(
    <board width="10mm" height="8mm">
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="rect"
        width="2mm"
        height="1.2mm"
        pcbX={1}
        pcbY={-0.5}
      />
      <pcbnotetext text="TSX TESTPOINT" pcbY={2.5} fontSize={0.7} />
    </board>,
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="14mm" height="10mm">
      <subcircuit name="IMPORTED" circuitJson={sourceCircuitJson} />
      <pcbnotetext text="INFLATED TESTPOINT" pcbY={3.5} fontSize={0.7} />
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
