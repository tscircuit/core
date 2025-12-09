import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test.skip("Jumper internally connected pins mix up between different Jumper components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="JP6"
        pinLabels={{
          pin1: ["GND"],
          pin2: ["VOUT"],
        }}
        footprint="pinrow2_p2.54_id1.016_od1.88_nosquareplating_pinlabeltextalignleft_pinlabelorthogonal"
        pcbX={-2}
        pcbY={2}
        pcbRotation={90}
        schY={0.2}
        schX={-3}
      />
      <resistor
        resistance="4.7k"
        name="R1"
        pcbRotation={270}
        pcbY={2}
        pcbX={3}
        footprint="0603"
        schY={1}
        schX={2}
        schRotation={90}
      />
      <trace from=".R1 > .pin1" to=".JP6 > .pin1" />
      <trace from=".SJ1 > .pin2" to=".JP6 > .pin1" />
      <trace from=".R1 > .pin2" to=".JP6 > .pin2" />
      <solderjumper
        cadModel={null}
        name="SJ1"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        footprint="solderjumper3_bridged123_p0.8_pw0.635_ph1.270"
        pcbX="1"
        pcbY="-3"
        layer="bottom"
        schY={2}
        schX={2.5}
        schRotation={180}
      />
    </board>,
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e) => e.type.includes("error"))
  console.log(errors)
  expect(errors.length).toBe(0)
})
