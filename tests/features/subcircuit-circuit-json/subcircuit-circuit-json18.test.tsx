import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit circuit JSON inflates simple_pin_header components", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="16mm" height="10mm">
      <pinheader
        name="J1"
        pinCount={4}
        gender="female"
        pinLabels={{ pin1: "VCC", pin2: "SDA", pin3: "SCL", pin4: "GND" }}
      />
    </board>,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="22mm" height="16mm">
      <subcircuit name="IMPORTED" circuitJson={subcircuitCircuitJson} />
      <pcbnotetext
        text="Imported simple_pin_header"
        pcbX={0}
        pcbY={6}
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.getWhere({ name: "J1" })).toMatchObject({
    ftype: "simple_pin_header",
    pin_count: 4,
    gender: "female",
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
