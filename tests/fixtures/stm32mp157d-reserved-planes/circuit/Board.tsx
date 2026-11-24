import React from "react"
import { DdrRouting } from "./DdrRouting"
import { UsbRouting } from "./UsbRouting"
import { RoutingPhases } from "./RoutingPhases"
import type { AutorouterProp } from "@tscircuit/props"
import { PowerInput } from "./PowerInput"
import { SystemRails } from "./SystemRails"
import { LinuxCompute } from "./LinuxCompute"
import { SafetyController } from "./SafetyController"
import { UsbDataSystem } from "./UsbDataSystem"
import { MotorPowerChannel } from "./MotorPowerChannel"
import { MotorDataPorts } from "./MotorDataPorts"
import { DebugAndTest } from "./DebugAndTest"
// All assembled components are on top; the six-layer stack includes bottom copper.
export default function Board({
  route = false,
  router = "auto-local",
  routingMode = "full",
}: {
  routingMode?: "full" | "fanout-ddr"
  route?: boolean
  router?: AutorouterProp
} = {}) {
  return (
    <board
      isViaInPadAllowed
      width={154}
      height={97}
      layers={6}
      minTraceWidth={0.15}
      minViaHoleDiameter={0.15}
      minViaPadDiameter={0.3}
      minTraceToPadEdgeClearance={0.125}
      minPadEdgeToPadEdgeClearance={0.15}
      minBoardEdgeClearance={0.25}
      routingDisabled={!route}
      routeRemaining={routingMode === "full"}
      autorouter={router}
      schMaxTraceDistance={2}
      schLayout={{ layoutMode: "relative" }}
    >
      <UsbRouting busesOnly={routingMode === "fanout-ddr"} />
      <DdrRouting />
      <RoutingPhases busesOnly={routingMode === "fanout-ddr"} />
      <copperpour
        name="GND_REFERENCE"
        connectsTo="net.GND"
        layer="inner1"
        unbroken
        clearance={0.2}
        boardEdgeMargin={0.5}
        useThermalReliefs={false}
      />
      <copperpour
        name="SYS3V3_PLANE"
        connectsTo="net.SYS3V3"
        layer="inner4"
        unbroken
        clearance={0.2}
        useThermalReliefs={false}
        outline={[
          { x: -76.5, y: -48 },
          { x: 76.5, y: -48 },
          { x: 76.5, y: 48 },
          { x: 22, y: 48 },
          { x: 22, y: 4.5 },
          { x: -11.5, y: 4.5 },
          { x: -11.5, y: 48 },
          { x: -76.5, y: 48 },
        ]}
      />
      <copperpour
        name="MPU3V3_PLANE"
        connectsTo="net.MPU3V3"
        layer="inner4"
        unbroken
        clearance={0.2}
        useThermalReliefs={false}
        outline={[
          { x: -11.1, y: 4.9 },
          { x: 21.6, y: 4.9 },
          { x: 21.6, y: 48 },
          { x: -11.1, y: 48 },
        ]}
      />
      <copperpour
        name="GND_TOP_FILL"
        connectsTo="net.GND"
        layer="top"
        clearance={0.2}
        boardEdgeMargin={0.5}
        useThermalReliefs={false}
      />
      <copperpour
        name="GND_BOTTOM_FILL"
        connectsTo="net.GND"
        layer="bottom"
        clearance={0.2}
        boardEdgeMargin={0.5}
        useThermalReliefs={false}
      />
      <copperpour
        name="DDR_POWER"
        connectsTo="net.DDR1V35"
        layer="inner2"
        unbroken
        clearance={0.2}
        useThermalReliefs={false}
        outline={[
          { x: -3, y: 24 },
          { x: 21, y: 24 },
          { x: 21, y: 46 },
          { x: -3, y: 46 },
        ]}
      />
      <copperpour
        name="MPU_CORE_PLANE"
        connectsTo="net.MPU_CORE"
        layer="inner2"
        unbroken
        clearance={0.2}
        useThermalReliefs={false}
        outline={[
          { x: -23, y: 10 },
          { x: 22.8, y: 10 },
          { x: 22.8, y: 23.6 },
          { x: -23, y: 23.6 },
        ]}
      />
      <PowerInput />
      <SystemRails />
      <LinuxCompute />
      <SafetyController />
      <UsbDataSystem />
      <MotorDataPorts />
      <DebugAndTest />
      {[-63, -39, -15, 9].map((x, i) => (
        <MotorPowerChannel key={i} channel={i + 1} x={x} />
      ))}
      {[
        [-72, -43],
        [72, -43],
        [-72, 43],
        [72, 43],
      ].map(([x, y], i) => (
        <React.Fragment key={i}>
          <hole name={`H${i + 1}`} pcbX={x} pcbY={y} diameter={3.2} />
        </React.Fragment>
      ))}
      <silkscreentext
        text="4-MOTOR USB-C / STM32MP157D"
        pcbX={52}
        pcbY={6}
        fontSize={0.8}
      />
      <silkscreentext
        text="REV B / ENGINEERING PROTOTYPE"
        pcbX={52}
        pcbY={4.5}
        fontSize={0.8}
      />
      <silkscreentext
        text="PD POWER  M1 - M4"
        pcbX={-27}
        pcbY={-39}
        fontSize={1}
      />
      <silkscreentext
        text="USB 2.0 DATA  M1 - M4"
        pcbX={45}
        pcbY={-39}
        fontSize={1}
      />
    </board>
  )
}
