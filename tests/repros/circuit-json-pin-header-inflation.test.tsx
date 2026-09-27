import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("Circuit JSON inflation preserves a pin header rendered from TSX", async () => {
  const sourceCircuitJson = await renderToCircuitJson(
    <board width="14mm" height="8mm">
      <pinheader
        name="J1"
        pinCount={4}
        gender="female"
        pinLabels={{ pin1: "VCC", pin2: "SDA", pin3: "SCL", pin4: "GND" }}
        pcbX={1}
        pcbY={-0.5}
      />
      <pcbnotetext text="TSX PIN HEADER" pcbY={2.5} fontSize={0.7} />
    </board>,
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="18mm" height="10mm">
      <subcircuit name="IMPORTED" circuitJson={sourceCircuitJson} />
      <pcbnotetext text="INFLATED PIN HEADER" pcbY={3.5} fontSize={0.7} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.getWhere({ name: "J1" })).toMatchObject({
    ftype: "simple_pin_header",
    pin_count: 4,
    gender: "female",
  })
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
