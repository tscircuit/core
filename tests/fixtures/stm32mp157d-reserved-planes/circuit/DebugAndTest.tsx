import { modelFor } from "./jlc-adapters"
import React from "react"
import { Wire, Title, Note, pcbPlacement } from "./parts"
export function DebugAndTest() {
  return (
    <schematicsheet
      name="debug"
      displayName="09 / Debug, boot, emergency loop and test points"
    >
      <Title
        text="09 — EDGE-ACCESSIBLE DEBUG / BOOT / E-STOP / POWER TEST POINTS"
        x={0}
        y={14}
      />
      <connector
        {...modelFor("PM254-1-06-Z-8.5")}
        name="J12"
        pcbX={62}
        pcbY={43}
        {...pcbPlacement("J12")}
        schX={-8 * 0.38}
        schY={6 * 0.45}
      />
      {["SYS3V3", "GND", "SWDIO", "SWCLK", "MCU_RESET_N", "GND"].map((n, i) => (
        <Wire key={i} from={`J12.pin${i + 1}`} to={n} />
      ))}
      <connector
        {...modelFor("PM254-1-02-Z-8.5")}
        name="J13"
        pcbX={82}
        pcbY={12}
        {...pcbPlacement("J13")}
        schX={8 * 0.38}
        schY={6 * 0.45}
      />
      <Wire from="J13.pin1" to="SYS3V3" />
      <Wire from="J13.pin2" to="ESTOP_OK" />
      <silkscreentext
        text="SWD / BOOT"
        pcbX={pcbPlacement("J12").pcbX ?? 62}
        pcbY={(pcbPlacement("J12").pcbY ?? 43) - 4}
        fontSize={1}
      />
      <silkscreentext
        text="E-STOP LOOP"
        pcbX={(pcbPlacement("J13").pcbX ?? 82) - 3}
        pcbY={(pcbPlacement("J13").pcbY ?? 12) - 3}
        fontSize={0.8}
      />
      {["GND", "VIN20", "MPU5V", "USB5V", "SYS3V3", "SAFE_ARMED"].map(
        (n, i) => (
          <React.Fragment key={n}>
            <testpoint
              name={`TP${i + 1}`}
              pcbX={43 + i * 7}
              pcbY={-18}
              {...pcbPlacement(`TP${i + 1}`)}
              schX={(-20 + i * 8) * 0.38}
              schY={-5 * 0.45}
              doNotPlace
              footprint={
                <footprint>
                  <smtpad portHints={["pin1"]} shape="circle" radius={0.6} />
                  <courtyardrect width={1.5} height={1.5} />
                </footprint>
              }
            />
            <Wire from={`TP${i + 1}.pin1`} to={n} />
          </React.Fragment>
        ),
      )}
      <Note
        text="Close external normally-closed emergency loop between J13 pins 1 and 2 to permit arming. Leave open during bring-up. Add a physical safety-rated disconnect where required by the machine."
        schX={0}
        schY={-12}
        fontSize={0.6}
      />
    </schematicsheet>
  )
}
