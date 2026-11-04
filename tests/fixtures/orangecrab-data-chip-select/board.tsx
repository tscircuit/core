import type { ReactElement } from "react"
import { SourcePart } from "../orangecrab-ddr-clock/source-part"
import source from "../orangecrab-ddr-clock/source-data.json"

const firstByte = Array.from({ length: 8 }, (_, bit) => `DDR_D${bit}`)
const secondByte = Array.from({ length: 8 }, (_, bit) => `DDR_D${bit + 8}`)
export const orangeCrabDataChipSelectConnections = [
  ...firstByte,
  ...secondByte,
  "DDR_CSN",
]

/** Native board-world points in mm (+X right, +Y up, +Z above, right-handed).
 * Reuse the pinned OrangeCrab footprints and nets. Route data before CS#;
 * power and the other DDR signals remain pending.
 */
export function OrangeCrabDataChipSelectBoard(): ReactElement {
  return (
    <board
      title="OrangeCrab data bytes followed by chip-select"
      width={source.width}
      height={source.height}
      layers={6}
      schematicDisabled
      routeRemaining={false}
      isViaInPadAllowed={false}
      minTraceWidth={Math.min(...source.rules.widths)}
      minTraceToPadEdgeClearance={source.rules.appliedGlobalClearance}
      minViaEdgeToPadEdgeClearance={source.rules.appliedGlobalClearance}
      minViaPadDiameter={source.rules.viaPad}
      minViaHoleDiameter={source.rules.viaDrill}
    >
      {source.parts.map((part) => (
        <SourcePart key={part.name} part={part} />
      ))}
      <autoroutingphase
        name="DATA_BYTE0"
        phaseIndex={0}
        autorouter="bus_lanes"
        connections={firstByte}
      />
      <autoroutingphase
        name="DATA_BYTE1"
        phaseIndex={1}
        autorouter="bus_lanes"
        connections={secondByte}
      />
      <autoroutingphase
        name="CHIP_SELECT"
        phaseIndex={2}
        autorouter="auto_local"
        connections={["DDR_CSN"]}
      />
      <bus
        name="DDR_BYTE0"
        connections={firstByte}
        routingPhaseIndex={0}
        pcbAllowedLayers={[
          "top",
          "inner1",
          "inner2",
          "inner3",
          "inner4",
          "bottom",
        ]}
      />
      <bus
        name="DDR_BYTE1"
        connections={secondByte}
        routingPhaseIndex={1}
        pcbAllowedLayers={[
          "top",
          "inner1",
          "inner2",
          "inner3",
          "inner4",
          "bottom",
        ]}
      />
      {source.connections.map((connection) => {
        let routingPhaseIndex: number | undefined
        if (firstByte.includes(connection.name)) routingPhaseIndex = 0
        if (secondByte.includes(connection.name)) routingPhaseIndex = 1
        if (connection.name === "DDR_CSN") routingPhaseIndex = 2
        return (
          <trace
            key={connection.name}
            name={connection.name}
            path={connection.points.map(
              (point) => `.${point.ref} > .${point.pin}`,
            )}
            thickness={connection.traceWidth}
            routingPhaseIndex={routingPhaseIndex}
          />
        )
      })}
      <pcbnotetext
        pcbX={7}
        pcbY={9.4}
        fontSize={0.5}
        text="OrangeCrab: data byte 0, data byte 1, then CS#"
      />
      <pcbnotetext pcbX={1.3} pcbY={8.2} fontSize={0.5} text="U3: ECP5" />
      <pcbnotetext pcbX={14.9} pcbY={7.5} fontSize={0.5} text="U4: DDR3" />
      <pcbnotetext
        pcbX={7}
        pcbY={-6.7}
        fontSize={0.45}
        text="17 requested paths; other DDR signals pending"
      />
      <pcbnotetext
        pcbX={7}
        pcbY={-7.4}
        fontSize={0.4}
        text="Native pads and routing rules; via-in-pad forbidden"
      />
    </board>
  )
}
