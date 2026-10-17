import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// USB-safety section from krishnax12/mtr-tiny-md v0.0.4, lib/usb-pd.tsx.
// https://tscircuit.com/krishnax12/mtr-tiny-md
// Keep the original connectivity and margins; omit PCB details and other sheets.
test("repro: MTR USB-safety parallel RC schematic detour", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board
      schAutoLayoutEnabled
      schTraceAutoLabelEnabled
      schMaxTraceDistance={6}
    >
      <chip
        name="U4"
        manufacturerPartNumber="SIA931DJ-T1-GE3"
        pinLabels={{
          pin1: ["S1"],
          pin2: ["G1"],
          pin3: ["D2_3"],
          pin4: ["S2"],
          pin5: ["G2"],
          pin6: ["D1_6"],
          pin7: ["D1_7"],
          pin8: ["D2_8"],
        }}
        pinAttributes={{
          pin1: { isPassive: true },
          pin2: { isPassive: true },
          pin3: { isPassive: true },
          pin4: { isPassive: true },
          pin5: { isPassive: true },
          pin6: { isPassive: true },
          pin7: { isPassive: true },
          pin8: { isPassive: true },
        }}
      />
      <resistor name="R10" resistance="20k" />
      <resistor name="R17" resistance="2.2k" />
      <resistor name="R18" resistance="820" schMarginX={1} schMarginY={0.5} />
      <capacitor
        name="C43"
        capacitance="4.7uF"
        schMarginX={1}
        schMarginY={0.5}
      />
      <jumper
        name="JP7"
        manufacturerPartNumber="+5V_SAFE"
        pinLabels={{ pin1: ["A_1", "1"], pin2: ["B_2", "2"] }}
        schMarginX={2}
        schMarginY={1}
      />
      <jumper
        name="VbusSafe1"
        manufacturerPartNumber="VbusJumper"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        pinAttributes={{ pin1: { isPassive: true }, pin2: { isPassive: true } }}
      />
      <led
        name="D4"
        pinLabels={{ pin1: "cathode", pin2: "anode" }}
        schMarginX={1}
        schMarginY={0.5}
      />

      <net
        name="DRAIN_1_SAFE"
        connectsTo={[
          "C43.pin1",
          "R10.pin2",
          "U4.pin6",
          "U4.pin7",
          "VbusSafe1.pin2",
        ]}
      />
      <net
        name="GATE_SAFE"
        connectsTo={["C43.pin2", "R10.pin1", "R17.pin2", "U4.pin2", "U4.pin5"]}
      />
      <net name="SOURCE_SAFE" connectsTo={["U4.pin1", "U4.pin4"]} />
      <net name="SAFE_PWR_EN" connectsTo={["R17.pin1"]} />
      <net name="VBUS" isPowerNet connectsTo={["VbusSafe1.pin1"]} />
      <net
        name="V5V_SAFE"
        isPowerNet
        connectsTo={["JP7.pin1", "R18.pin2", "U4.pin3", "U4.pin8"]}
      />
      <net name="Net__D4_A" connectsTo={["D4.pin2", "R18.pin1"]} />
      <net name="GND" isGroundNet connectsTo={["D4.pin1"]} />
      <net name="ALIM" isPowerNet connectsTo={["JP7.pin2"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
