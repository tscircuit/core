import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const driverPinLabels = {
  pin1: "AGC_OUT",
  pin2: "TEST",
  pin3: "VM",
  pin4: "OUT_A_P",
  pin5: "ATEST",
  pin6: "OUT_A_N",
  pin7: "OUT_B_N",
  pin8: "RSG",
  pin9: "OUT_B_P",
  pin10: "VM",
  pin11: "ADMD",
  pin12: "AGC_AUTO",
  pin13: "AGC_ON",
  pin14: "AWGS",
  pin15: "AGND_1",
  pin16: "GND",
  pin17: "STOP_DET_VTH",
  pin18: "OSCM",
  pin19: "KPKI_NANO",
  pin20: "AGC_TIME",
  pin21: "FREQ_MIN",
  pin22: "VSP_MIN",
  pin23: "AGC_KI",
  pin24: "AGC_KP",
  pin25: "TARGET_ANGLE",
  pin26: "NFHYS",
  pin27: "MTBLANK",
  pin28: "STBLANK",
  pin29: "CTBLANK",
  pin30: "VREG",
  pin31: "LO2",
  pin32: "LO1",
  pin33: "LO0",
  pin34: "MO",
  pin35: "VREF",
  pin36: "SLEEP_X",
  pin37: "RESET_X",
  pin38: "CW_CCW",
  pin39: "ENABLE",
  pin40: "CLK",
  pin41: "DMODE0",
  pin42: "DMODE1",
  pin43: "DMODE2",
  pin44: "DECAY1",
  pin45: "DECAY2",
  pin46: "AGND_2",
  pin47: "SERIAL_CLK",
  pin48: "SERIAL_IN",
  pin49: "PGND",
} as const

const leftHeaderLabels = {
  pin1: "VIN",
  pin2: "VM",
  pin3: "STOP_DET_VTH",
  pin4: "KPKI_NANO",
  pin5: "AGC_TIME",
  pin6: "FREQ_MIN",
  pin7: "VSP_MIN",
  pin8: "AGC_KI",
  pin9: "AGC_KP",
  pin10: "TARGET_ANGLE",
  pin11: "NFHYS",
  pin12: "MTBLANK",
  pin13: "STBLANK",
  pin14: "CTBLANK",
  pin15: "IOREF",
  pin16: "VREG",
  pin17: "GND_1",
  pin18: "GND_2",
  pin19: "GND_3",
} as const

const controlHeaderLabels = {
  pin1: "A_P",
  pin2: "A_N",
  pin3: "B_N",
  pin4: "B_P",
  pin5: "SERIAL_IN",
  pin6: "SERIAL_CLK",
  pin7: "DMODE2",
  pin8: "DMODE1",
  pin9: "DMODE0",
  pin10: "CLK",
  pin11: "CW_CCW",
  pin12: "ENABLE",
  pin13: "RESET_X",
  pin14: "SLEEP_X",
  pin15: "LO2",
  pin16: "LO1",
  pin17: "LO0",
  pin18: "MO",
  pin19: "AGC_OUT",
} as const

type DriverPinName =
  | keyof typeof driverPinLabels
  | (typeof driverPinLabels)[keyof typeof driverPinLabels]
type LeftHeaderPinName =
  | keyof typeof leftHeaderLabels
  | (typeof leftHeaderLabels)[keyof typeof leftHeaderLabels]
type ControlHeaderPinName =
  | keyof typeof controlHeaderLabels
  | (typeof controlHeaderLabels)[keyof typeof controlHeaderLabels]

const u1 = sel.U1<DriverPinName>()
const j1 = sel.J1<LeftHeaderPinName>()
const j4 = sel.J4<ControlHeaderPinName>()

const leftPins = [
  17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 13, 14, 12, 11, 45, 44, 35, 1,
  18,
]

const rightPins = [
  4, 6, 7, 9, 48, 47, 43, 42, 41, 40, 38, 39, 37, 36, 31, 32, 33, 34,
]

const TB67S579FTGBreakoutSchematic = () => (
  <board width="24mm" height="18mm" routingDisabled schMaxTraceDistance={20}>
    <schematicsection name="TB67S579FTG breakout" />
    <chip
      name="U1"
      schSectionName="TB67S579FTG breakout"
      manufacturerPartNumber="TB67S579FTG"
      pinLabels={driverPinLabels}
      schX={0}
      schY={0}
      schWidth={3.29}
      schHeight={6.35}
      pcbX={0}
      pcbY={0}
      schPinArrangement={{
        leftSide: { pins: leftPins, direction: "top-to-bottom" },
        topSide: { pins: [3, 10, 30], direction: "left-to-right" },
        rightSide: { pins: rightPins, direction: "top-to-bottom" },
        bottomSide: {
          pins: [2, 5, 8, 15, 16, 46, 49],
          direction: "left-to-right",
        },
      }}
      schPinStyle={{
        pin13: { marginTop: 0.4 },
        pin35: { marginTop: 0.4 },
        pin18: { marginTop: 0.4 },
        pin48: { marginTop: 1.1 },
        pin31: { marginTop: 0.7 },
        pin30: { marginLeft: 1.245 },
        pin10: { marginLeft: 1.245 },
        pin2: { marginRight: 0.282 },
        pin5: { marginRight: 0.282 },
        pin8: { marginRight: 0.282 },
        pin15: { marginRight: 0.282 },
        pin16: { marginRight: 0.282 },
        pin46: { marginRight: 0.28 },
      }}
    />

    <connector
      name="J1"
      schSectionName="TB67S579FTG breakout"
      pinLabels={leftHeaderLabels}
      schWidth={2.24}
      schX={-7}
      schY={1.2}
      pcbX={-8}
      pcbY={5}
      schPinArrangement={{
        rightSide: {
          pins: Array.from({ length: 19 }, (_, index) => index + 1),
          direction: "top-to-bottom",
        },
      }}
    />

    <connector
      name="J4"
      schSectionName="TB67S579FTG breakout"
      pinLabels={controlHeaderLabels}
      schWidth={2.05}
      schX={7}
      schY={-0.4}
      pcbX={8}
      pcbY={-5}
      schPinArrangement={{
        leftSide: {
          pins: Array.from({ length: 19 }, (_, index) => index + 1),
          direction: "top-to-bottom",
        },
      }}
    />

    <trace name="STOP_DET_VTH" from={j1.STOP_DET_VTH} to={u1.STOP_DET_VTH} />
    <trace name="KPKI_NANO" from={j1.KPKI_NANO} to={u1.KPKI_NANO} />
    <trace name="AGC_TIME" from={j1.AGC_TIME} to={u1.AGC_TIME} />
    <trace name="FREQ_MIN" from={j1.FREQ_MIN} to={u1.FREQ_MIN} />
    <trace name="VSP_MIN" from={j1.VSP_MIN} to={u1.VSP_MIN} />
    <trace name="AGC_KI" from={j1.AGC_KI} to={u1.AGC_KI} />
    <trace name="AGC_KP" from={j1.AGC_KP} to={u1.AGC_KP} />
    <trace name="TARGET_ANGLE" from={j1.TARGET_ANGLE} to={u1.TARGET_ANGLE} />
    <trace name="NFHYS" from={j1.NFHYS} to={u1.NFHYS} />
    <trace name="MTBLANK" from={j1.MTBLANK} to={u1.MTBLANK} />
    <trace name="STBLANK" from={j1.STBLANK} to={u1.STBLANK} />
    <trace name="CTBLANK" from={j1.CTBLANK} to={u1.CTBLANK} />
    <trace name="VM_1" from={j1.pin2} to={u1.pin3} />
    <trace name="VM_2" from={j1.pin2} to={u1.pin10} />
    <trace name="VREG" from={j1.VREG} to={u1.VREG} />
    <trace name="GND" from={j1.GND_1} to={u1.GND} />

    <trace name="OUT_A_P" from={j4.pin1} to={u1.pin4} />
    <trace name="OUT_A_N" from={j4.pin2} to={u1.pin6} />
    <trace name="OUT_B_N" from={j4.pin3} to={u1.pin7} />
    <trace name="OUT_B_P" from={j4.pin4} to={u1.pin9} />
    <trace name="SERIAL_IN" from={j4.SERIAL_IN} to={u1.SERIAL_IN} />
    <trace name="SERIAL_CLK" from={j4.SERIAL_CLK} to={u1.SERIAL_CLK} />
    <trace name="DMODE2" from={j4.DMODE2} to={u1.DMODE2} />
    <trace name="DMODE1" from={j4.DMODE1} to={u1.DMODE1} />
    <trace name="DMODE0" from={j4.DMODE0} to={u1.DMODE0} />
    <trace name="CLK" from={j4.CLK} to={u1.CLK} />
    <trace name="CW_CCW" from={j4.CW_CCW} to={u1.CW_CCW} />
    <trace name="ENABLE" from={j4.ENABLE} to={u1.ENABLE} />
    <trace name="RESET_X" from={j4.RESET_X} to={u1.RESET_X} />
    <trace name="SLEEP_X" from={j4.SLEEP_X} to={u1.SLEEP_X} />
    <trace name="LO2" from={j4.LO2} to={u1.LO2} />
    <trace name="LO1" from={j4.LO1} to={u1.LO1} />
    <trace name="LO0" from={j4.LO0} to={u1.LO0} />
    <trace name="MO" from={j4.MO} to={u1.MO} />
    <trace name="AGC_OUT" from={j4.AGC_OUT} to={u1.AGC_OUT} />
  </board>
)

test("TB67S579FTG breakout renders named point-to-point traces", async () => {
  const { circuit } = getTestFixture()
  let solverInputProblem: InputProblem | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblem = event.solverParams as InputProblem
    }
  })

  circuit.add(<TB67S579FTGBreakoutSchematic />)
  await circuit.renderUntilSettled()

  expect(
    solverInputProblem?.directConnections.find(
      (connection) => connection.netId === "AGC_OUT",
    )?.anchoredNetLabelWidth,
  ).toBe(0.96)

  for (const routedNetId of [
    "OUT_A_P",
    "OUT_A_N",
    "OUT_B_N",
    "OUT_B_P",
    "SERIAL_IN",
  ]) {
    expect(
      circuit.db.schematic_text
        .list()
        .filter((text) => text.text === routedNetId),
    ).toHaveLength(1)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
