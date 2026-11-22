import type { ReactElement } from "react"
import type { BoardProps, BusProps } from "@tscircuit/props"
import { NativePart } from "./native-part"

type DdrSource = {
  id: string
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
    nativeNet: string
    /** Unordered native net members; the fixture retains its legacy field name. */
    path: string[]
    width: number
    group: string
  }[]
  requestedNames?: string[]
  routeByteGroupsTogether?: boolean
}

type RoutingGroup = string

/** Native placements in board-world mm, +X right, +Y up, +Z above.
 * Preserve all pads on the DDR components; route byte groups before remaining nets.
 */
export function NativeDdrBoard({
  source,
  dataOnly = false,
  geometryOnly = false,
}: {
  source: DdrSource
  dataOnly?: boolean
  geometryOnly?: boolean
}): ReactElement {
  const activeTraces = source.requestedNames
    ? source.traces.filter((trace) =>
        source.requestedNames!.includes(trace.name),
      )
    : source.traces
  const activeNames = new Set(activeTraces.map((trace) => trace.name))
  const bytes = [...new Set(activeTraces.map((trace) => trace.group))]
    .filter((group) => group !== "remaining" && group !== "preflight")
    .sort()
  const preflight = activeTraces.some((trace) => trace.group === "preflight")
    ? ["preflight"]
    : []
  const phaseNameByGroup = new Map<RoutingGroup, string>(
    ["preflight", ...bytes, "remaining"].map((group) => [group, group]),
  )
  if (source.routeByteGroupsTogether) {
    for (const group of bytes) phaseNameByGroup.set(group, "bytes")
  }
  const groups = dataOnly ? bytes : [...preflight, ...bytes, "remaining"]
  const phases = [...new Set(groups.map((group) => phaseNameByGroup.get(group)!))]
  const bytePhases = new Set(bytes.map((group) => phaseNameByGroup.get(group)!))
  return (
    <board
      title={source.title}
      width={source.width}
      height={source.height}
      layers={source.layers}
      schematicDisabled
      routingDisabled={geometryOnly}
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
      {phases.map((group, phaseIndex) => (
        <autoroutingphase
          key={group}
          name={group}
          phaseIndex={phaseIndex}
          autorouter={bytePhases.has(group) ? "bus_lanes" : "auto_local"}
          connections={activeTraces
            .filter((trace) => phaseNameByGroup.get(trace.group) === group)
            .flatMap((trace) => trace.path)}
        />
      ))}
      {source.traces.map((trace) => (
        <net
          key={trace.name}
          name={trace.name}
          connectsTo={trace.path}
          nominalTraceWidth={trace.width}
          routingPhaseIndex={
            activeNames.has(trace.name) && groups.includes(trace.group)
              ? phases.indexOf(phaseNameByGroup.get(trace.group)!)
              : undefined
          }
        />
      ))}
      {bytes.map((group) => (
        <bus
          key={group}
          name={`DDR_BUS_${group}`}
          routingPhaseIndex={phases.indexOf(phaseNameByGroup.get(group)!)}
          connections={activeTraces
            .filter((trace) => trace.group === group)
            .map((trace) => trace.path[0])}
          pcbAllowedLayers={source.signalLayers}
        />
      ))}
      <pcbnotetext
        pcbY={source.height / 2 - 0.8}
        fontSize={0.5}
        text={`${source.title}: ${dataOnly ? activeTraces.filter((trace) => trace.group !== "remaining").length : activeTraces.length} DDR nets requested`}
      />
      <pcbnotetext
        pcbY={-source.height / 2 + 0.8}
        fontSize={0.45}
        text="Native geometry; no via-in-pad. Bus bytes, then remaining signals. Timing unqualified."
      />
    </board>
  )
}
