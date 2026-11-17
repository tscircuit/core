import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import { simulationTimeToMilliseconds } from "./simulation-time-to-milliseconds"

export function writeSignalIntegrityRecords(
  block: PcbTransientChannelSimulation,
) {
  const { db } = block.root!
  const props = block._parsedProps
  const durationMs =
    props.duration === undefined
      ? undefined
      : simulationTimeToMilliseconds(props.duration, props.bitRate)
  if (
    durationMs !== undefined &&
    !(durationMs > 0 && Number.isFinite(durationMs))
  )
    throw new Error("duration must be finite and greater than zero.")

  // Updates merge fields. Replace records to clear omitted optional values.
  const simulations = db.simulation_pcb_transient_channel_simulation
  const {
    simulation_pcb_transient_channel_simulation_id: previousSimulationId,
  } = block
  if (previousSimulationId) simulations.delete(previousSimulationId)
  const { simulation_pcb_transient_channel_simulation_id } = simulations.insert(
    {
      ...(previousSimulationId
        ? {
            simulation_pcb_transient_channel_simulation_id:
              previousSimulationId,
          }
        : {}),
      ...(props.name === undefined ? {} : { name: props.name }),
      bit_rate_bps: props.bitRate,
      ...(durationMs === undefined ? {} : { duration_ms: durationMs }),
      allow_unrouted_traces: props.allowUnroutedTraces,
    },
  )
  block.simulation_pcb_transient_channel_simulation_id =
    simulation_pcb_transient_channel_simulation_id
}
