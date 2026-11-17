import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import { simulationTimeToMilliseconds } from "./simulation-time-to-milliseconds"

function getDurationMs(props: PcbTransientChannelSimulation["_parsedProps"]) {
  if (props.duration === undefined) return undefined
  const durationMs = simulationTimeToMilliseconds(props.duration, props.bitRate)
  if (!(durationMs > 0 && Number.isFinite(durationMs)))
    throw new Error("duration must be finite and greater than zero.")
  return durationMs
}

export function writeSignalIntegrityRecords(
  block: PcbTransientChannelSimulation,
) {
  const { db } = block.root!
  const props = block._parsedProps
  const durationMs = getDurationMs(props)

  // Updates merge fields. Replace records to clear omitted optional values.
  const simulations = db.simulation_pcb_transient_channel_simulation
  const record = {
    name: props.name,
    bit_rate_bps: props.bitRate,
    duration_ms: durationMs,
    allow_unrouted_traces: props.allowUnroutedTraces,
  }
  const {
    simulation_pcb_transient_channel_simulation_id: previousSimulationId,
  } = block
  // A supplied ID, even undefined, overrides the database's generated ID.
  if (previousSimulationId) {
    simulations.delete(previousSimulationId)
    Object.assign(record, {
      simulation_pcb_transient_channel_simulation_id: previousSimulationId,
    })
  }
  block.simulation_pcb_transient_channel_simulation_id =
    simulations.insert(record).simulation_pcb_transient_channel_simulation_id
}
