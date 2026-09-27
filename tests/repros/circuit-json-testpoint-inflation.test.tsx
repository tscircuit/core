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
        schRotation={90}
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
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
  expect(circuit.db.schematic_component.list()[0]).toMatchObject({
    symbol_name: "testpoint_up",
  })
  const schematicPort = circuit.db.schematic_port.list()[0]
  expect(schematicPort.facing_direction).toBe("down")
  expect(schematicPort.center.x).toBeCloseTo(0)
  expect(schematicPort.center.y).toBeCloseTo(-0.2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
