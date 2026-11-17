import type { ReactElement } from "react"
import { NativePart } from "@tscircuit/core-ddr-benchmark/circuits/native-part"
import type { BoardProps, BusProps } from "@tscircuit/props"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

/** The immutable native H3 fixture fields used by this phase diagnostic. */
export type NativeH3Source = {
  title: string
  width: number
  height: number
  layers: BoardProps["layers"]
  rules: {
    widths: number[]
    appliedGlobalClearance: number
    viaPad: number
    viaDrill: number
  }
  signalLayers: BusProps["pcbAllowedLayers"]
  parts: Parameters<typeof NativePart>[0]["part"][]
  traces: {
    name: string
    path: string[]
    width: number
    group: string
  }[]
}

const phaseNames = ["byte0", "byte1", "remaining"]
const byteGroups = ["byte0", "byte1"]

/** Native board-world points in mm, +X right, +Y up and +Z above.
 * Omitting the optional capture runs every phase through its actual router.
 * The phase-intent repro supplies a callback that deliberately aborts byte 0.
 */
export function H3RoutingPhaseIntentBoard({
  source,
  captureFirstPhase,
}: {
  source: NativeH3Source
  captureFirstPhase?: (simpleRouteJson: SimpleRouteJson) => Promise<never>
}): ReactElement {
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
      {phaseNames.map((phaseName, phaseIndex) => (
        <autoroutingphase
          key={phaseName}
          name={phaseName}
          phaseIndex={phaseIndex}
          autorouter={
            byteGroups.includes(phaseName) ? "bus_lanes" : "auto_local"
          }
          algorithmFn={phaseIndex === 0 ? captureFirstPhase : undefined}
          connections={source.traces
            .filter((trace) => trace.group === phaseName)
            .flatMap((trace) => trace.path)}
        />
      ))}
      {source.traces.map((trace) => (
        <net
          name={trace.name}
          connectsTo={trace.path}
          nominalTraceWidth={trace.width}
          routingPhaseIndex={phaseNames.indexOf(trace.group)}
        />
      ))}
      {byteGroups.map((group) => (
        <bus
          name={`DDR_BUS_${group}`}
          routingPhaseIndex={phaseNames.indexOf(group)}
          connections={source.traces
            .filter((trace) => trace.group === group)
            .map((trace) => trace.path[0])}
          pcbAllowedLayers={source.signalLayers}
        />
      ))}
    </board>
  )
}
