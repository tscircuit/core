import { DRV8833PWPR } from "../imports/DRV8833PWPR"
import {
  logicTrace,
  powerTrace,
  schematicSections,
  schematicSheets,
} from "./config"
import {
  capacitor0402Footprint,
  resistor0402Footprint,
} from "./exact0402Footprints"

export const MotorDriverController = () => (
  <>
    <DRV8833PWPR
      name="DRIVER"
      pcbX={11}
      pcbY={-0.5}
      schX={-5.5}
      schY={0}
      schWidth={3.8}
      schHeight={4.6}
      schMarginLeft={1}
      schMarginRight={1}
      schPinArrangement={{
        leftSide: {
          pins: [2, 3, 4, 7, 6, 5],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [16, 15, 9, 10, 1, 8],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: [12, 11, 14],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: [13, 17],
          direction: "left-to-right",
        },
      }}
      schPinStyle={{
        pin7: { marginTop: 0.45 },
        pin9: { marginTop: 0.45 },
        pin1: { marginTop: 0.45 },
        pin11: { marginLeft: 0.35 },
      }}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
  </>
)

export const MotorDriverPassives = () => (
  <>
    <capacitor
      name="C_VM_BULK"
      capacitance="10uF"
      footprint="1206"
      pcbX={16.1}
      pcbY={2.35}
      maxDecouplingTraceLength={5.5}
      schX={-1.2}
      schY={-3.5}
      schMarginX={0.15}
      schMarginY={0.25}
      schOrientation="vertical"
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <capacitor
      name="C_VM_HF"
      capacitance="100nF"
      footprint="0603"
      pcbX={12.15}
      pcbY={4}
      maxDecouplingTraceLength={5.5}
      schX={-1.2}
      schY={-1.5}
      schMarginX={0.15}
      schMarginY={0.25}
      schOrientation="vertical"
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <capacitor
      name="C_VCP"
      capacitance="10nF"
      footprint={capacitor0402Footprint()}
      pcbX={8}
      pcbY={6}
      schX={-1.2}
      schY={0.5}
      schMarginX={0.15}
      schMarginY={0.25}
      schOrientation="vertical"
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <capacitor
      name="C_VINT"
      capacitance="2.2uF"
      footprint="0603"
      maxDecouplingTraceLength={6.5}
      pcbX={5}
      pcbY={2}
      schX={-1.2}
      schY={2.5}
      schMarginX={0.15}
      schMarginY={0.25}
      schOrientation="vertical"
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />

    <resistor
      name="R_ISEN_A"
      resistance="0.2"
      footprint="2512"
      pcbX={5}
      pcbY={-9}
      schX={-10}
      schY={1.5}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <resistor
      name="R_ISEN_B"
      resistance="0.2"
      footprint="2512"
      pcbX={17}
      pcbY={-9}
      schX={-10}
      schY={-1.5}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <resistor
      name="R_SLEEP_PD"
      resistance="100k"
      footprint={resistor0402Footprint()}
      pcbX={5}
      pcbY={-3}
      schX={-8}
      schY={-4.5}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
    <resistor
      name="R_FAULT_PU"
      resistance="10k"
      footprint={resistor0402Footprint()}
      pcbX={5}
      pcbY={-5}
      schX={-8}
      schY={-7}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.driverCore}
    />
  </>
)

export const MotorDriverControlTraces = () => (
  <>
    <trace
      name="DRIVER_AIN1"
      from=".MCU > .U1 > .GPIO0"
      to=".DRIVER > .AIN1"
      {...logicTrace}
    />
    <trace
      name="DRIVER_AIN2"
      from=".MCU > .U1 > .GPIO1"
      to=".DRIVER > .AIN2"
      {...logicTrace}
    />
    <trace
      name="DRIVER_BIN1"
      from=".MCU > .U1 > .GPIO2"
      to=".DRIVER > .BIN1"
      {...logicTrace}
    />
    <trace
      name="DRIVER_BIN2"
      from=".MCU > .U1 > .GPIO3"
      to=".DRIVER > .BIN2"
      {...logicTrace}
    />
    <trace
      name="DRIVER_SLEEP"
      from=".MCU > .U1 > .GPIO4"
      to=".DRIVER > .nSleep"
      {...logicTrace}
    />
    <trace
      name="DRIVER_FAULT"
      from=".MCU > .U1 > .GPIO5"
      to=".DRIVER > .nFault"
      {...logicTrace}
    />
  </>
)

export const MotorDriverPowerTraces = () => (
  <>
    <trace
      name="VM_BULK"
      from=".DRIVER > .VM"
      to=".C_VM_BULK > .pin1"
      schDisplayLabel="VMOTOR"
      {...powerTrace}
    />
    <trace
      name="VM_HF"
      from=".DRIVER > .VM"
      to=".C_VM_HF > .pin1"
      {...powerTrace}
    />
    <trace
      name="VCP_SUPPLY"
      from=".DRIVER > .VM"
      to=".C_VCP > .pin2"
      {...logicTrace}
    />
  </>
)

export const MotorDriverPrimaryGroundTraces = () => (
  <>
    <trace
      name="COMMON_GND"
      from=".DRIVER > .GND2"
      to=".MCU > .U1 > .GND"
      {...powerTrace}
    />
    <trace
      name="DRIVER_GND_JOIN"
      from=".DRIVER > .GND1"
      to=".DRIVER > .GND2"
      {...powerTrace}
    />
  </>
)

export const MotorDriverGroundTraces = () => (
  <>
    <trace
      name="ISEN_A_GND"
      from=".R_ISEN_A > .pin2"
      to=".DRIVER > .GND2"
      {...powerTrace}
    />
    <trace
      name="ISEN_B_GND"
      from=".R_ISEN_B > .pin2"
      to=".DRIVER > .GND2"
      {...powerTrace}
    />
    <trace
      name="VINT_GND"
      from=".C_VINT > .pin2"
      to=".DRIVER > .GND2"
      {...logicTrace}
    />
    <trace
      name="VM_BULK_GND"
      from=".C_VM_BULK > .pin2"
      to="net.GND"
      {...powerTrace}
    />
    <trace
      name="VM_HF_GND"
      from=".C_VM_HF > .pin2"
      to="net.GND"
      {...powerTrace}
    />
    <trace
      name="SLEEP_PULLDOWN_GND"
      from=".R_SLEEP_PD > .pin2"
      to="net.GND"
      {...logicTrace}
    />
  </>
)

export const MotorDriverSenseAndControlTraces = () => (
  <>
    <trace
      name="ISEN_A"
      from=".DRIVER > .AISEN"
      to=".R_ISEN_A > .pin1"
      schDisplayLabel="A_ISEN"
      {...powerTrace}
    />
    <trace
      name="ISEN_B"
      from=".DRIVER > .BISEN"
      to=".R_ISEN_B > .pin1"
      schDisplayLabel="B_ISEN"
      {...powerTrace}
    />
    <trace
      name="VCP"
      from=".DRIVER > .VCP"
      to=".C_VCP > .pin1"
      schDisplayLabel="VCP"
      {...logicTrace}
    />
    <trace
      name="VINT"
      from=".DRIVER > .VINT"
      to=".C_VINT > .pin1"
      schDisplayLabel="VINT"
      {...logicTrace}
    />
    <trace
      name="SLEEP_PULLDOWN"
      from=".R_SLEEP_PD > .pin1"
      to=".DRIVER > .nSleep"
      schDisplayLabel="nSLEEP"
      {...logicTrace}
    />
    <trace
      name="FAULT_PULLUP"
      from=".R_FAULT_PU > .pin1"
      to=".DRIVER > .nFault"
      schDisplayLabel="nFAULT"
      {...logicTrace}
    />
    <trace
      name="FAULT_PULLUP_3V3"
      from=".R_FAULT_PU > .pin2"
      to=".MCU > .U1 > .IOVDD1"
      {...logicTrace}
    />
  </>
)
