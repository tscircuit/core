import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro118", async () => {
  const { circuit } = getTestFixture()

  const pinLabels = {
    pin1: ["CS_N", "CS"],
    pin2: ["IO1", "DO"],
    pin3: ["IO2", "WP_N"],
    pin4: ["GND"],
    pin5: ["IO0", "DI"],
    pin6: ["CLK"],
    pin7: ["IO3", "HOLD_N"],
    pin8: ["VCC"],
  } as const

  circuit.add(
    <board>
      <net name="VCC" isPowerNet />
      <chip
        name="U1"
        pinLabels={pinLabels}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["CS_N", "IO1", "IO2", "GND"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "IO3", "CLK", "IO0"],
          },
        }}
      />
      <chip
        name="U2"
        pinLabels={pinLabels}
        schX="2"
        schY="2"
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["CS_N", "IO1", "IO2", "GND"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "IO3", "CLK", "IO0"],
          },
        }}
      />
      <trace from="U1.VCC" to="net.VCC" />
      <trace from="U1.IO0" to="net.VCC" />
      <trace from="U1.CLK" to="U2.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  circuit.on("debug:logOutput", (e) => {
    if (e.name === "group-trace-render-input-problem") {
      console.log(e.content)
    }
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
