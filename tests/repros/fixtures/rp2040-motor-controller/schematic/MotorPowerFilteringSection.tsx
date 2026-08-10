import { powerTrace, schematicSections, schematicSheets } from "./config"

export const MotorPowerFilteringComponents = () => (
  <capacitor
    name="C_PD_VBUS"
    capacitance="10uF"
    footprint="1206"
    pcbX={30.4}
    pcbY={25.7}
    pcbRotation={270}
    maxDecouplingTraceLength={10}
    schX={3}
    schY={-7.5}
    schOrientation="vertical"
    schSheetName={schematicSheets.motorPower}
    schSectionName={schematicSections.pdFiltering}
  />
)

export const MotorPowerFilteringSupplyTrace = () => (
  <trace
    name="MOTOR_VBUS_CAP"
    from=".J_MOTOR_USB > .A4B9"
    to=".C_PD_VBUS > .pin1"
    {...powerTrace}
  />
)

export const MotorPowerFilteringGroundTrace = () => (
  <trace
    name="PD_VBUS_CAP_GND"
    from=".C_PD_VBUS > .pin2"
    to="net.GND"
    {...powerTrace}
  />
)
