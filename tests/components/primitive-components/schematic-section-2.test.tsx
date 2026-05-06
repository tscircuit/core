import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSection groups a real 555 LED flasher into four regions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <net name="VCC" />
      <net name="GND" />
      <schematicsection name="power" displayName="Power" />
      <battery
        name="B1"
        footprint="axial_p0.3in"
        schX={-4}
        schY={3}
        schSectionName="power"
      />
      <switch name="SW1" spst schX={-2} schY={3} schSectionName="power" />
      <capacitor
        name="C3"
        capacitance="10uF"
        footprint="0805"
        schX={-3}
        schY={1.5}
        schSectionName="power"
      />
      <schematicsection name="timer" displayName="555 Timer" />
      <schematicsection name="timing-network" displayName="Timing Network" />
      <schematicsection name="output" displayName="Output" />
      <chip
        name="U1"
        footprint="soic8"
        schX={1.5}
        schY={2.5}
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["RESET", "CTRL", "THRES", "TRIG"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "OUT", "DISCH", "GND"],
          },
        }}
        schSectionName="timer"
      />
      <capacitor
        name="C2"
        capacitance="10nF"
        footprint="0805"
        schX={4}
        schY={1.5}
        schSectionName="timer"
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0805"
        schX={-4}
        schY={-1.5}
        schSectionName="timing-network"
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0805"
        schX={-2}
        schY={-1.5}
        schSectionName="timing-network"
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="1206"
        schX={-3}
        schY={-3}
        schSectionName="timing-network"
      />
      <resistor
        name="R3"
        resistance="330"
        footprint="0805"
        schX={2.5}
        schY={-1.5}
        schSectionName="output"
      />
      <led
        name="D1"
        color="red"
        footprint="led0603"
        schDisplayValue="RED"
        schX={4.5}
        schY={-1.5}
        schSectionName="output"
      />
      <trace from=".B1 > .pin1" to=".SW1 > .pin1" schDisplayLabel="BTN_IN" />
      <trace from=".SW1 > .pin2" to="net.VCC" schDisplayLabel="SW_TO_VCC" />
      <trace from=".B1 > .pin2" to="net.GND" schDisplayLabel="BTN_GND" />
      <trace from=".C3 > .pin1" to="net.VCC" schDisplayLabel="C3_VCC" />
      <trace from=".C3 > .pin2" to="net.GND" schDisplayLabel="C3_GND" />
      <trace from=".U1 > .VCC" to="net.VCC" schDisplayLabel="IC_VCC" />
      <trace from=".U1 > .GND" to="net.GND" schDisplayLabel="IC_GND" />
      <trace from=".U1 > .RESET" to="net.VCC" schDisplayLabel="RESET_PULLUP" />
      <trace
        from=".U1 > .CTRL"
        to=".C2 > .pin1"
        schDisplayLabel="CTRL_FILTER"
      />
      <trace from=".C2 > .pin2" to="net.GND" schDisplayLabel="C2_GND" />
      <trace
        from=".U1 > .THRES"
        to=".U1 > .TRIG"
        schDisplayLabel="THRES_TRIG"
      />
      <trace from="net.VCC" to=".R1 > .pin1" schDisplayLabel="VCC_R1" />

      <trace from=".R1 > .pin2" to=".U1 > .DISCH" schDisplayLabel="R1_DISCH" />
      <trace from=".U1 > .DISCH" to=".R2 > .pin1" schDisplayLabel="DISCH_R2" />
      <trace from=".R2 > .pin2" to=".U1 > .THRES" schDisplayLabel="R2_THRES" />
      <trace from=".U1 > .THRES" to=".C1 > .pin1" schDisplayLabel="THRES_C1" />
      <trace from=".C1 > .pin2" to="net.GND" schDisplayLabel="C1_GND" />
      <trace from=".U1 > .OUT" to=".R3 > .pin1" schDisplayLabel="OUT_R3" />
      <trace from=".R3 > .pin2" to=".D1 > .pin1" schDisplayLabel="R3_LED" />
      <trace from=".D1 > .pin2" to="net.GND" schDisplayLabel="LED_GND" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
