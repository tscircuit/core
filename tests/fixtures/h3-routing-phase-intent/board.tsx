import type { ReactElement } from "react"
import type { NativeDdrBoard } from "@tscircuit/core-ddr-benchmark/circuits/native-ddr-board"
import { NativePart } from "@tscircuit/core-ddr-benchmark/circuits/native-part"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export type NativeH3Source = Parameters<typeof NativeDdrBoard>[0]["source"]

const phaseNames = ["byte0", "byte1", "remaining"]
const byteGroups = ["byte0", "byte1"]

/** Native board-world points in mm, +X right, +Y up and +Z above.
 * The first callback captures Core's actual request and deliberately aborts.
 */
export function H3RoutingPhaseIntentBoard({
  source,
  captureFirstPhase,
}: {
  source: NativeH3Source
  captureFirstPhase: (simpleRouteJson: SimpleRouteJson) => Promise<never>
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
          key={trace.name}
          name={trace.name}
          connectsTo={trace.path}
          nominalTraceWidth={trace.width}
          routingPhaseIndex={phaseNames.indexOf(trace.group)}
        />
      ))}
      {byteGroups.map((group) => (
        <bus
          key={group}
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
