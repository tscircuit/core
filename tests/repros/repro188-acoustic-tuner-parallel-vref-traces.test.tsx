import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const attiny1616PinLabels = {
  pin1: "PA2",
  pin2: "PA3",
  pin3: "GND",
  pin4: "VDD",
  pin5: "PA4",
  pin6: "PA5",
  pin7: "PA6",
  pin8: "PA7",
  pin9: "PB5",
  pin10: "PB4",
  pin11: "PB3",
  pin12: "PB2",
  pin13: "PB1",
  pin14: "PB0",
  pin15: "PC0",
  pin16: "PC1",
  pin17: "PC2",
  pin18: "PC3",
  pin19: "PA0_UPDI",
  pin20: "PA1",
  pin21: "EP",
} as const

const opAmpPinLabels = {
  pin1: "OUTA",
  pin2: "INA_NEG",
  pin3: "INA_POS",
  pin4: "VSS_NEG",
  pin5: "INB_POS",
  pin6: "INB_NEG",
  pin7: "OUTB",
  pin8: "VDD",
} as const

test("repro188: acoustic tuner creates near-parallel VREF traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board schAutoLayoutEnabled schTraceAutoLabelEnabled>
      <schematicsheet
        name="main"
        displayName="Mini Acoustic Guitar Tuner"
        sheetSize="A4"
      >
        <chip
          name="BT1"
          pinLabels={{ pin1: "1", pin2: "2" }}
          pinAttributes={{
            pin1: { providesPower: true },
            pin2: { requiresGround: true },
          }}
          symbol={
            <symbol>
              <port
                name="pin2"
                pinNumber={2}
                aliases={["2"]}
                direction="down"
                schX={0}
                schY={-0.4}
                schStemLength={0.3}
              />
              <port
                name="pin1"
                pinNumber={1}
                aliases={["1"]}
                direction="up"
                schX={0}
                schY={0.4}
                schStemLength={0.3}
              />
              <schematicpath
                points={[
                  { x: 0.08, y: 0.1 },
                  { x: 0.08, y: -0.08 },
                ]}
                strokeColor="#880000"
              />
              <schematicpath
                points={[
                  { x: 0.02, y: 0.18 },
                  { x: 0.02, y: -0.14 },
                ]}
                strokeColor="#880000"
              />
              <schematicpath
                points={[
                  { x: -0.04, y: 0.1 },
                  { x: -0.04, y: -0.08 },
                ]}
                strokeColor="#880000"
              />
              <schematicpath
                points={[
                  { x: -0.1, y: 0.18 },
                  { x: -0.1, y: -0.14 },
                ]}
                strokeColor="#880000"
              />
            </symbol>
          }
        />
        <switch name="SW1" schRotation={90} />

        <capacitor name="C1" capacitance="100nF" schOrientation="vertical" />
        <capacitor name="C2" capacitance="1uF" schOrientation="vertical" />
        <resistor name="R1" resistance="100k" schOrientation="vertical" />
        <resistor name="R2" resistance="100k" schOrientation="vertical" />
        <capacitor name="C3" capacitance="1uF" schOrientation="vertical" />
        <capacitor name="C7" capacitance="100nF" schOrientation="vertical" />

        <chip
          name="MK1"
          pinLabels={{ pin1: "VDD", pin2: "OUT", pin3: "GND" }}
          pinAttributes={{
            pin1: { requiresPower: true },
            pin3: { requiresGround: true },
          }}
          schWidth={1.7}
          schHeight={0.4}
          schPinArrangement={{
            leftSide: {
              pins: ["VDD", "GND"],
              direction: "top-to-bottom",
            },
            rightSide: { pins: ["OUT"], direction: "top-to-bottom" },
          }}
        />
        <capacitor name="C4" capacitance="100nF" schOrientation="vertical" />
        <capacitor name="C5" capacitance="100nF" schOrientation="vertical" />
        <resistor name="R3" resistance="100k" schOrientation="vertical" />
        <chip
          name="U1"
          pinLabels={opAmpPinLabels}
          pinAttributes={{
            pin4: { requiresGround: true },
            pin8: { requiresPower: true },
          }}
          schWidth={2.5}
          schHeight={1}
          schPinArrangement={{
            leftSide: {
              pins: ["INA_POS", "INA_NEG", "INB_POS", "INB_NEG"],
              direction: "top-to-bottom",
            },
            rightSide: {
              pins: ["VDD", "OUTA", "OUTB", "VSS_NEG"],
              direction: "top-to-bottom",
            },
          }}
        />
        <resistor name="R4" resistance="10k" schOrientation="vertical" />
        <resistor name="R5" resistance="100k" />
        <resistor name="R6" resistance="10k" />
        <capacitor name="C6" capacitance="10nF" schOrientation="vertical" />

        <chip
          name="U2"
          pinLabels={attiny1616PinLabels}
          pinAttributes={{
            pin3: { requiresGround: true },
            pin4: { requiresPower: true },
            pin19: { mustBeConnected: true },
            pin21: { requiresGround: true },
          }}
          schWidth={2.2}
          schHeight={2.2}
          schPinArrangement={{
            leftSide: {
              pins: [
                "VDD",
                "PA2",
                "PA3",
                "PA4",
                "PA5",
                "PA6",
                "PA7",
                "PA1",
                "PA0_UPDI",
                "GND",
                "EP",
              ],
              direction: "top-to-bottom",
            },
            rightSide: {
              pins: [
                "PB5",
                "PB4",
                "PB3",
                "PB2",
                "PB1",
                "PB0",
                "PC0",
                "PC1",
                "PC2",
                "PC3",
              ],
              direction: "top-to-bottom",
            },
          }}
        />
        <pushbutton name="SW2" schRotation={-90} />
        <testpoint name="TP_UPDI" footprintVariant="pad" />
        <testpoint name="TP_VCC" footprintVariant="pad" />
        <testpoint name="TP_GND" footprintVariant="pad" />

        <resistor name="R7" resistance="1k" schOrientation="vertical" />
        <led name="LED_E2" color="yellow" schRotation={90} />
        <resistor name="R8" resistance="1k" schOrientation="vertical" />
        <led name="LED_A2" color="yellow" schRotation={90} />
        <resistor name="R9" resistance="1k" schOrientation="vertical" />
        <led name="LED_D3" color="yellow" schRotation={90} />
        <resistor name="R10" resistance="1k" schOrientation="vertical" />
        <led name="LED_G3" color="yellow" schRotation={90} />
        <resistor name="R11" resistance="1k" schOrientation="vertical" />
        <led name="LED_B3" color="yellow" schRotation={90} />
        <resistor name="R12" resistance="1k" schOrientation="vertical" />
        <led name="LED_E4" color="yellow" schRotation={90} />
        <resistor name="R13" resistance="1k" schOrientation="vertical" />
        <led name="LED_FLAT" color="red" schRotation={90} />
        <resistor name="R14" resistance="1k" schOrientation="vertical" />
        <led name="LED_TUNE" color="green" schRotation={90} />
        <resistor name="R15" resistance="1k" schOrientation="vertical" />
        <led name="LED_SHARP" color="red" schRotation={90} />

        <trace from="BT1.pin1" to="SW1.pin1" />
        <trace from="BT1.pin2" to="net.GND" />
        <trace from="SW1.pin2" to="net.VCC" />
        <trace from="C1.pin1" to="net.VCC" />
        <trace from="C1.pin2" to="net.GND" />
        <trace from="C2.pin1" to="net.VCC" />
        <trace from="C2.pin2" to="net.GND" />
        <trace from="R1.pin1" to="net.VCC" />
        <trace from="R1.pin2" to="net.VREF" />
        <trace from="R2.pin1" to="net.VREF" />
        <trace from="R2.pin2" to="net.GND" />
        <trace from="C3.pin1" to="net.VREF" />
        <trace from="C3.pin2" to="net.GND" />
        <trace from="C7.pin1" to="net.VCC" />
        <trace from="C7.pin2" to="net.GND" />

        <trace from="MK1.VDD" to="net.VCC" />
        <trace from="MK1.GND" to="net.GND" />
        <trace from="C4.pin1" to="net.VCC" />
        <trace from="C4.pin2" to="net.GND" />
        <trace from="MK1.OUT" to="C5.pin1" />
        <trace from="C5.pin2" to="net.MIC_AC" />
        <trace from="R3.pin1" to="net.MIC_AC" />
        <trace from="R3.pin2" to="net.VREF" />
        <trace from="U1.INA_POS" to="net.MIC_AC" />
        <trace from="U1.INA_NEG" to="net.FB_A" />
        <trace from="R4.pin1" to="net.FB_A" />
        <trace from="R4.pin2" to="net.VREF" />
        <trace from="U1.OUTA" to="net.PREAMP" />
        <trace from="R5.pin1" to="net.PREAMP" />
        <trace from="R5.pin2" to="net.FB_A" />
        <trace from="R6.pin1" to="net.PREAMP" />
        <trace from="R6.pin2" to="net.FILTER" />
        <trace from="C6.pin1" to="net.FILTER" />
        <trace from="C6.pin2" to="net.GND" />
        <trace from="U1.INB_POS" to="net.FILTER" />
        <trace from="U1.INB_NEG" to="net.AUDIO_ADC" />
        <trace from="U1.OUTB" to="net.AUDIO_ADC" />
        <trace from="U1.VDD" to="net.VCC" />
        <trace from="U1.VSS_NEG" to="net.GND" />

        <trace from="U2.VDD" to="net.VCC" />
        <trace from="U2.GND" to="net.GND" />
        <trace from="U2.EP" to="net.GND" />
        <trace from="U2.PA2" to="net.AUDIO_ADC" />
        <trace from="U2.PB0" to="SW2.pin1" />
        <trace from="SW2.pin2" to="net.GND" />
        <trace from="U2.PA0_UPDI" to="TP_UPDI.pin1" />
        <trace from="TP_VCC.pin1" to="net.VCC" />
        <trace from="TP_GND.pin1" to="net.GND" />

        <trace from="U2.PA4" to="R7.pin1" />
        <trace from="R7.pin2" to="LED_E2.pos" />
        <trace from="LED_E2.neg" to="net.GND" />
        <trace from="U2.PA5" to="R8.pin1" />
        <trace from="R8.pin2" to="LED_A2.pos" />
        <trace from="LED_A2.neg" to="net.GND" />
        <trace from="U2.PA6" to="R9.pin1" />
        <trace from="R9.pin2" to="LED_D3.pos" />
        <trace from="LED_D3.neg" to="net.GND" />
        <trace from="U2.PA7" to="R10.pin1" />
        <trace from="R10.pin2" to="LED_G3.pos" />
        <trace from="LED_G3.neg" to="net.GND" />
        <trace from="U2.PB5" to="R11.pin1" />
        <trace from="R11.pin2" to="LED_B3.pos" />
        <trace from="LED_B3.neg" to="net.GND" />
        <trace from="U2.PB4" to="R12.pin1" />
        <trace from="R12.pin2" to="LED_E4.pos" />
        <trace from="LED_E4.neg" to="net.GND" />
        <trace from="U2.PB3" to="R13.pin1" />
        <trace from="R13.pin2" to="LED_FLAT.pos" />
        <trace from="LED_FLAT.neg" to="net.GND" />
        <trace from="U2.PB1" to="R15.pin1" />
        <trace from="R15.pin2" to="LED_SHARP.pos" />
        <trace from="LED_SHARP.neg" to="net.GND" />
        <trace from="U2.PB2" to="R14.pin1" />
        <trace from="R14.pin2" to="LED_TUNE.pos" />
        <trace from="LED_TUNE.neg" to="net.GND" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  const vrefNet = circuit.db.source_net.getWhere({ name: "VREF" })!
  const verticalVrefEdges = circuit.db.schematic_trace
    .list()
    .filter(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        vrefNet.subcircuit_connectivity_map_key,
    )
    .flatMap((trace) => trace.edges)
    .filter(({ from, to }) => from.x === to.x)

  const hasNearParallelOverlap = verticalVrefEdges.some((edge, edgeIndex) =>
    verticalVrefEdges.slice(edgeIndex + 1).some((otherEdge) => {
      const separation = Math.abs(edge.from.x - otherEdge.from.x)
      const overlap =
        Math.min(
          Math.max(edge.from.y, edge.to.y),
          Math.max(otherEdge.from.y, otherEdge.to.y),
        ) -
        Math.max(
          Math.min(edge.from.y, edge.to.y),
          Math.min(otherEdge.from.y, otherEdge.to.y),
        )

      return separation > 0 && separation <= 0.05 && overlap > 1
    }),
  )

  expect(hasNearParallelOverlap).toBe(true)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1800,
    height: 1000,
  })
})
