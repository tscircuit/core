import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Connector with resistor and solder jumper circuit layout same net not combine", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25mm" height="20mm" routingDisabled>
      <jumper
        name="JP6"
        pinLabels={{
          pin1: ["GND"],
          pin2: ["VOUT"],
        }}
        footprint="pinrow2_p2.54"
        schY={0.5}
        schX={-4}
      />
      <resistor
        resistance="4.7k"
        name="R1"
        footprint="0603"
        schY={1.2}
        schX={-0.2}
        schRotation={90}
      />
      <solderjumper
        name="SJ2"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        footprint="solderjumper3_bridged123_p0.8_pw0.635_ph1.270"
        schY={2.2}
        schX={0.3}
        schRotation={180}
      />
      <trace from=".JP6 > .pin2" to=".R1 > .pin2" />
      <trace from=".R1 > .pin2" to=".R1 > .pin1" />
      <trace from=".JP6 > .pin1" to=".JP6 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  expect(errors.length).toBe(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
