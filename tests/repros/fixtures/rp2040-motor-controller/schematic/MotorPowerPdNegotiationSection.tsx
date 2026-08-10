import { CH224K } from "../imports/CH224K"
import { TYPE_C_16PIN_2MD_073_ } from "../imports/TYPE_C_16PIN_2MD_073_"
import {
  logicTrace,
  powerTrace,
  schematicSections,
  schematicSheets,
} from "./config"

export const MotorPowerPdControllers = () => (
  <>
    <TYPE_C_16PIN_2MD_073_
      name="J_MOTOR_USB"
      noConnect={["B8", "A8"]}
      pcbX={28}
      pcbY={31}
      pcbRotation={180}
      schX={5.5}
      schY={0}
      schWidth={3}
      schHeight={5}
      schPinArrangement={{
        leftSide: {
          pins: [1, 3, 5, 6, 8, 10, 11, 13],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [2, 4, 16, 15, 14, 12, 9, 7],
          direction: "top-to-bottom",
        },
      }}
      schPinStyle={{
        pin5: { marginTop: 0.4 },
        pin8: { marginTop: 0.4 },
        pin16: { marginTop: 0.4 },
        pin14: { marginTop: 0.4 },
      }}
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
    <CH224K
      name="U_PD"
      noConnect={["CFG2", "CFG3", "PG"]}
      pcbX={18}
      pcbY={23}
      pcbRotation={90}
      schX={-5}
      schY={0}
      schWidth={2.6}
      schHeight={3.6}
      schMarginRight={1}
      schPinArrangement={{
        leftSide: {
          pins: [4, 5, 6, 7],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [10, 9, 8],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: [1, 2, 3],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: [11],
          direction: "left-to-right",
        },
      }}
      schPinStyle={{
        pin6: { marginTop: 0.4 },
        pin8: { marginTop: 0.4 },
        pin2: { marginLeft: 0.3 },
      }}
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
  </>
)

export const MotorPowerPdPassives = () => (
  <>
    <capacitor
      name="C_PD_VDD"
      capacitance="1uF"
      footprint="0603"
      pcbX={22.5}
      pcbY={18.8}
      maxDecouplingTraceLength={10}
      schX={-7.8}
      schY={0}
      schOrientation="vertical"
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
    <resistor
      name="R_PD_VDD"
      resistance="1k"
      footprint="0603"
      pcbX={15}
      pcbY={29}
      schX={0}
      schY={3}
      schMarginX={0.25}
      schMarginY={0.2}
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
    <resistor
      name="R_PD_VBUS"
      resistance="10k"
      footprint="0603"
      pcbX={24}
      pcbY={21}
      schX={1.5}
      schY={0.75}
      schMarginX={0.25}
      schMarginY={0.2}
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
    <resistor
      name="R_PD_CFG1"
      resistance="6.8k"
      footprint="0603"
      pcbX={11}
      pcbY={19}
      schX={-1.5}
      schY={-2.5}
      schMarginX={0.25}
      schMarginY={0.2}
      schSheetName={schematicSheets.motorPower}
      schSectionName={schematicSections.pdNegotiation}
    />
  </>
)

export const MotorPowerPdInputTraces = () => (
  <>
    <trace
      name="MOTOR_VBUS_JOIN"
      from=".J_MOTOR_USB > .A4B9"
      to=".J_MOTOR_USB > .B4A9"
      {...powerTrace}
    />
    <trace
      name="MOTOR_VBUS_VM"
      from=".J_MOTOR_USB > .A4B9"
      to=".DRIVER > .VM"
      schDisplayLabel="VMOTOR"
      {...powerTrace}
    />
  </>
)

export const MotorPowerPdProtocolTraces = () => (
  <>
    <trace
      name="PD_VDD_FEED"
      from=".J_MOTOR_USB > .A4B9"
      to=".R_PD_VDD > .pin1"
      {...logicTrace}
    />
    <trace
      name="PD_VBUS_SENSE_FEED"
      from=".J_MOTOR_USB > .A4B9"
      to=".R_PD_VBUS > .pin1"
      {...logicTrace}
    />
    <trace
      name="PD_VDD_INPUT"
      from=".R_PD_VDD > .pin2"
      to=".U_PD > .VDD"
      schDisplayLabel="PD_VDD"
      {...logicTrace}
    />
    <trace
      name="PD_VBUS_INPUT"
      from=".R_PD_VBUS > .pin2"
      to=".U_PD > .VBUS"
      schDisplayLabel="PD_VBUS"
      {...logicTrace}
    />
    <trace
      name="PD_VDD_DECOUPLE"
      from=".U_PD > .VDD"
      to=".C_PD_VDD > .pin1"
      {...logicTrace}
    />
    <trace
      name="PD_CFG1"
      from=".U_PD > .CFG1"
      to=".R_PD_CFG1 > .pin1"
      schDisplayLabel="CFG1"
      {...logicTrace}
    />
    <trace
      name="PD_CC1"
      from=".J_MOTOR_USB > .A5"
      to=".U_PD > .CC1"
      schDisplayLabel="CC1"
      {...logicTrace}
    />
    <trace
      name="PD_CC2"
      from=".J_MOTOR_USB > .B5"
      to=".U_PD > .CC2"
      schDisplayLabel="CC2"
      {...logicTrace}
    />
    <trace
      name="PD_DP_A"
      from=".J_MOTOR_USB > .A6"
      to=".U_PD > .DP"
      schDisplayLabel="USB_D+"
      {...logicTrace}
    />
    <trace
      name="PD_DP_JOIN"
      from=".J_MOTOR_USB > .B6"
      to=".J_MOTOR_USB > .A6"
      {...logicTrace}
    />
    <trace
      name="PD_DM_A"
      from=".J_MOTOR_USB > .A7"
      to=".U_PD > .DM"
      schDisplayLabel="USB_D-"
      {...logicTrace}
    />
    <trace
      name="PD_DM_JOIN"
      from=".J_MOTOR_USB > .B7"
      to=".J_MOTOR_USB > .A7"
      {...logicTrace}
    />
  </>
)

export const MotorPowerPdPrimaryGroundTrace = () => (
  <>
    <trace
      name="MOTOR_USB_GND_A"
      from=".J_MOTOR_USB > .A1B12"
      to=".DRIVER > .GND2"
      {...powerTrace}
    />
  </>
)

export const MotorPowerPdConnectorGroundTraces = () => (
  <>
    <trace
      name="MOTOR_USB_GND_JOIN"
      from=".J_MOTOR_USB > .B1A12"
      to=".J_MOTOR_USB > .A1B12"
      {...powerTrace}
    />
    <trace
      name="MOTOR_USB_SHIELD_1"
      from=".J_MOTOR_USB > .EH1"
      to=".J_MOTOR_USB > .A1B12"
      {...powerTrace}
    />
    <trace
      name="MOTOR_USB_SHIELD_2"
      from=".J_MOTOR_USB > .EH2"
      to=".J_MOTOR_USB > .A1B12"
      {...powerTrace}
    />
    <trace
      name="MOTOR_USB_SHIELD_3"
      from=".J_MOTOR_USB > .EH3"
      to=".J_MOTOR_USB > .A1B12"
      {...powerTrace}
    />
    <trace
      name="MOTOR_USB_SHIELD_4"
      from=".J_MOTOR_USB > .EH4"
      to=".J_MOTOR_USB > .A1B12"
      {...powerTrace}
    />
    <trace
      name="PD_GND"
      from=".U_PD > .GND"
      to=".DRIVER > .GND2"
      {...powerTrace}
    />
  </>
)

export const MotorPowerPdSupportGroundTraces = () => (
  <>
    <trace
      name="PD_VDD_CAP_GND"
      from=".C_PD_VDD > .pin2"
      to="net.GND"
      {...logicTrace}
    />
    <trace
      name="PD_CFG1_GND"
      from=".R_PD_CFG1 > .pin2"
      to=".DRIVER > .GND2"
      {...logicTrace}
    />
  </>
)
