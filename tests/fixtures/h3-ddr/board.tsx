import { Fragment, type ReactElement } from "react"
import { NativePart } from "@tscircuit/core-ddr-benchmark/circuits/native-part"
import source from "./source-data.json"

const phaseNames = ["byte0", "byte1", "remaining"]
const byteGroups = ["byte0", "byte1"]

/** Native H3 board-world points in mm: +X right, +Y top, +Z above,
 * right-handed. Route both data bytes before the other DDR signals.
 */
export function H3DdrBoard(): ReactElement {
  return (
    <board
      title={source.title}
      width={source.width}
      height={source.height}
      layers={2}
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
        <NativePart key={part.name} part={part} />
      ))}
      {phaseNames.map((phaseName, phaseIndex) => {
        let autorouter: "auto_local" | "bus_lanes" = "auto_local"
        if (byteGroups.includes(phaseName)) autorouter = "bus_lanes"
        return (
          <autoroutingphase
            key={phaseName}
            name={phaseName}
            phaseIndex={phaseIndex}
            autorouter={autorouter}
            connections={source.traces
              .filter((trace) => trace.group === phaseName)
              .map((trace) => trace.name)}
          />
        )
      })}
      {source.traces.map((trace) => (
        <trace
          key={trace.name}
          name={trace.name}
          path={trace.path}
          thickness={trace.width}
          routingPhaseIndex={phaseNames.indexOf(trace.group)}
        />
      ))}
      {byteGroups.map((group) => (
        <Fragment key={group}>
          <bus
            name={`DDR_BUS_${group}`}
            routingPhaseIndex={phaseNames.indexOf(group)}
            connections={source.traces
              .filter((trace) => trace.group === group)
              .map((trace) => trace.name)}
            pcbAllowedLayers={["top", "bottom"]}
          />
        </Fragment>
      ))}
      <pcbnotetext
        pcbY={source.height / 2 - 0.8}
        fontSize={0.5}
        text={`${source.title}: ${source.traces.length} DDR nets requested`}
      />
      <pcbnotetext
        pcbY={-source.height / 2 + 0.8}
        fontSize={0.45}
        text="Native geometry; no via-in-pad. Bus bytes, then remaining signals. Timing unqualified."
      />
    </board>
  )
}
