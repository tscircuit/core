import { WJ500V_5_08_2P } from "../imports/WJ500V_5_08_2P"
import { motorTrace, schematicSections, schematicSheets } from "./config"

export const MotorOutputConnectors = () => (
  <>
    <WJ500V_5_08_2P
      name="P_MOTOR_A"
      pcbX={34}
      pcbY={5}
      pcbRotation={270}
      schX={9}
      schY={2.5}
      schPinArrangement={{
        leftSide: { pins: [1], direction: "top-to-bottom" },
        rightSide: { pins: [2], direction: "top-to-bottom" },
      }}
      schPinStyle={{
        pin1: { marginTop: 0 },
        pin2: { marginTop: 0 },
      }}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.motorOutputs}
    />
    <WJ500V_5_08_2P
      name="P_MOTOR_B"
      pcbX={34}
      pcbY={-15}
      pcbRotation={270}
      schX={9}
      schY={-5.5}
      schPinArrangement={{
        leftSide: { pins: [1], direction: "top-to-bottom" },
        rightSide: { pins: [2], direction: "top-to-bottom" },
      }}
      schPinStyle={{
        pin1: { marginTop: 0 },
        pin2: { marginTop: 0 },
      }}
      schSheetName={schematicSheets.motorDriver}
      schSectionName={schematicSections.motorOutputs}
    />
  </>
)

export const MotorOutputTraces = () => (
  <>
    <trace
      name="MOTOR_A1"
      from=".DRIVER > .AOUT1"
      to=".P_MOTOR_A > .pin1"
      schDisplayLabel="MOTOR_A1"
      {...motorTrace}
    />
    <trace
      name="MOTOR_A2"
      from=".DRIVER > .AOUT2"
      to=".P_MOTOR_A > .pin2"
      schDisplayLabel="MOTOR_A2"
      {...motorTrace}
    />
    <trace
      name="MOTOR_B1"
      from=".DRIVER > .BOUT1"
      to=".P_MOTOR_B > .pin1"
      schDisplayLabel="MOTOR_B1"
      {...motorTrace}
    />
    <trace
      name="MOTOR_B2"
      from=".DRIVER > .BOUT2"
      to=".P_MOTOR_B > .pin2"
      schDisplayLabel="MOTOR_B2"
      {...motorTrace}
    />
  </>
)
