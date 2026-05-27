import { sel } from "tscircuit"

export const W25Q128JVS_SECTION = "qspi"

const W25Q128JVS_X = 8.2
const W25Q128JVS_Y = -7.6

const W25Q128JVS_PIN_LABELS = {
  pin1: "CS",
  pin2: "DO",
  pin3: "IO2",
  pin4: "GND",
  pin5: "DI",
  pin6: "CLK",
  pin7: "IO3",
  pin8: "VCC",
} as const

export const W25Q128JVSCircuit = () => (
  <>
    <chip
      schSectionName={W25Q128JVS_SECTION}
      name="U4"
      schX={W25Q128JVS_X}
      schY={W25Q128JVS_Y}
      pinLabels={W25Q128JVS_PIN_LABELS}
      schPinStyle={{
        DO: {
          marginBottom: "0.2",
        },
        CS: {
          marginBottom: "0.2",
        },
      }}
      pinAttributes={{
        VCC: { requiresPower: true },
        GND: { requiresGround: true },
      }}
      schPinArrangement={{
        topSide: {
          pins: ["VCC"],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: ["GND"],
          direction: "left-to-right",
        },
        leftSide: {
          pins: ["CS", "CLK"],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: ["DI", "DO", "IO2", "IO3"],
          direction: "top-to-bottom",
        },
      }}
    />
    <resistor
      schSectionName={W25Q128JVS_SECTION}
      schX={W25Q128JVS_X - 1.5}
      schY={W25Q128JVS_Y + 1.5}
      name="R12"
      resistance="16k"
      schOrientation="vertical"
    />

    <trace from={sel.U4.pin1} to={sel.R12.pin2} />
    <trace from={sel.U4.pin8} to={sel.R12.pin1} />

    <capacitor
      schSectionName={W25Q128JVS_SECTION}
      name="C25"
      capacitance="10uF"
      schX={W25Q128JVS_X + 2.5}
      schY={W25Q128JVS_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={W25Q128JVS_SECTION}
      name="C26"
      capacitance="100uF"
      schX={W25Q128JVS_X + 3.5}
      schY={W25Q128JVS_Y}
      schOrientation="vertical"
    />

    <trace from={sel.C25.pin1} to={sel.net.V3_3} />
    <trace from={sel.C26.pin1} to={sel.net.V3_3} />

    <trace from={sel.C25.pin2} to={sel.net.GND} />
    <trace from={sel.C26.pin2} to={sel.net.GND} />
  </>
)

export default () => (
  <board schAutoLayoutEnabled>
    <W25Q128JVSCircuit />
  </board>
)
