import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple gunn diodes fail to render", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="J1"
        pinLabels={{
          pin1: "DN2",
          pin2: "DP2",
          pin3: "GND2",
        }}
      />
      <diode
        symbolName={"gunn_diode_vert"}
        name="D1"
        connections={{
          pin1: "J1.DN2",
          pin2: "J1.GND2",
        }}
      />
      <diode
        symbolName={"gunn_diode_vert"}
        name="D2"
        connections={{
          pin1: "J1.DP2",
          pin2: "J1.GND2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
