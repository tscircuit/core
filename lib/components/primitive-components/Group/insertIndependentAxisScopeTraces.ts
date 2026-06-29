import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SimulationOscilloscopeTrace } from "circuit-json"
import type { InsertedSimulationGraph } from "./InsertedSimulationGraph"
import { getAutoDisplayScale } from "./getAutoDisplayScale"

const isDefinedString = (value: string | undefined): value is string =>
  value !== undefined

const getTraceByVoltageProbeId = (traces: SimulationOscilloscopeTrace[]) => {
  const traceByVoltageProbeId = new Map<string, SimulationOscilloscopeTrace>()

  for (const trace of traces) {
    if (trace.simulation_voltage_probe_id) {
      traceByVoltageProbeId.set(trace.simulation_voltage_probe_id, trace)
    }
  }

  return traceByVoltageProbeId
}

const getTraceByCurrentProbeId = (traces: SimulationOscilloscopeTrace[]) => {
  const traceByCurrentProbeId = new Map<string, SimulationOscilloscopeTrace>()

  for (const trace of traces) {
    if (trace.simulation_current_probe_id) {
      traceByCurrentProbeId.set(trace.simulation_current_probe_id, trace)
    }
  }

  return traceByCurrentProbeId
}

export const insertIndependentAxisScopeTraces = ({
  db,
  graphs,
}: {
  db: CircuitJsonUtilObjects
  graphs: InsertedSimulationGraph[]
}) => {
  if (graphs.length === 0) return

  const existingScopeTraces = db.simulation_oscilloscope_trace.list()
  const traceByVoltageProbeId = getTraceByVoltageProbeId(existingScopeTraces)
  const traceByCurrentProbeId = getTraceByCurrentProbeId(existingScopeTraces)
  const graphIdsWithTrace = new Set(
    existingScopeTraces
      .flatMap((trace) => [
        trace.simulation_transient_voltage_graph_id,
        trace.simulation_transient_current_graph_id,
      ])
      .filter(isDefinedString),
  )

  for (const [index, { type, graph }] of graphs.entries()) {
    const scale = getAutoDisplayScale({
      graph,
      index,
      graphCount: graphs.length,
    })
    if (!scale) continue

    const graphId =
      type === "voltage"
        ? graph.simulation_transient_voltage_graph_id
        : graph.simulation_transient_current_graph_id
    if (graphIdsWithTrace.has(graphId)) continue

    const sourceProbeId = graph.source_probe_id ?? undefined
    const probeTrace =
      sourceProbeId === undefined
        ? undefined
        : type === "voltage"
          ? traceByVoltageProbeId.get(sourceProbeId)
          : traceByCurrentProbeId.get(sourceProbeId)

    db.simulation_oscilloscope_trace.insert({
      ...(type === "voltage"
        ? {
            simulation_transient_voltage_graph_id:
              graph.simulation_transient_voltage_graph_id,
            volts_per_div: scale.value_per_div,
          }
        : {
            simulation_transient_current_graph_id:
              graph.simulation_transient_current_graph_id,
            amps_per_div: scale.value_per_div,
          }),
      display_name: probeTrace?.display_name,
      color: probeTrace?.color ?? graph.color,
      display_center_value: scale.display_center_value,
      display_center_offset_divs: scale.display_center_offset_divs,
    })
  }
}
