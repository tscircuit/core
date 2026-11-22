import type { SimulationPcbTransientChannelSimulation } from "circuit-json"
import type { PcbDriverReceiverChannel } from "lib/components/primitive-components/PcbDriverReceiverChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import type { resolveSignalEndpoint } from "./resolve-signal-endpoint"
import { simulationTimeToMilliseconds } from "./simulation-time-to-milliseconds"

function getDurationMs(props: PcbTransientChannelSimulation["_parsedProps"]) {
  if (props.duration === undefined) return undefined
  const durationMs = simulationTimeToMilliseconds(props.duration, props.bitRate)
  if (!(durationMs > 0 && Number.isFinite(durationMs)))
    throw new Error("duration must be finite and greater than zero.")
  return durationMs
}

type ResolvedSignal = {
  signal: PcbDriverReceiverChannel
  driver: ReturnType<typeof resolveSignalEndpoint>
  receivers: ReturnType<typeof resolveSignalEndpoint>[]
  seed: number | undefined
}

function getChannelRecord(
  { signal, driver, receivers, seed }: ResolvedSignal,
  defaultBitRate: number,
) {
  const channelProps = signal._parsedProps
  const bitRate = channelProps.bitRate ?? defaultBitRate
  const offsetMs = simulationTimeToMilliseconds(channelProps.offset, bitRate)
  if (!Number.isFinite(offsetMs))
    throw new Error(`Channel "${channelProps.name}" offset must be finite.`)
  return {
    signal,
    record: {
      name: channelProps.name,
      driver: driver.record,
      receivers: receivers.map((receiver) => receiver.record),
      bit_rate_bps: bitRate,
      pattern: channelProps.pattern,
      seed,
      offset_ms: offsetMs,
      driver_disabled: channelProps.driverDisabled || undefined,
    },
  }
}

export function writeSignalIntegrityRecords(
  block: PcbTransientChannelSimulation,
  signals: ResolvedSignal[],
) {
  const { db } = block.root!
  const props = block._parsedProps
  const durationMs = getDurationMs(props)

  const channels = signals.map((signal) =>
    getChannelRecord(signal, props.bitRate),
  )

  // Updates merge fields. Replace records to clear omitted optional values.
  const simulations = db.simulation_pcb_transient_channel_simulation
  const simulationRecord: Omit<
    SimulationPcbTransientChannelSimulation,
    "type" | "simulation_pcb_transient_channel_simulation_id"
  > = {
    name: props.name,
    bit_rate_bps: props.bitRate,
    duration_ms: durationMs,
    allow_unrouted_traces: props.allowUnroutedTraces,
  }
  if (props.aggressorPattern !== undefined)
    simulationRecord.aggressor_pattern = props.aggressorPattern
  if (props.aggressorDisabled !== undefined)
    simulationRecord.aggressor_disabled = props.aggressorDisabled
  const {
    simulation_pcb_transient_channel_simulation_id: previousSimulationId,
  } = block
  // A supplied ID, even undefined, overrides the database's generated ID.
  if (previousSimulationId) {
    simulations.delete(previousSimulationId)
    Object.assign(simulationRecord, {
      simulation_pcb_transient_channel_simulation_id: previousSimulationId,
    })
  }
  const { simulation_pcb_transient_channel_simulation_id } =
    simulations.insert(simulationRecord)
  block.simulation_pcb_transient_channel_simulation_id =
    simulation_pcb_transient_channel_simulation_id

  for (const { signal, record } of channels) {
    const channelRecords = db.simulation_pcb_driver_receiver_channel
    const channelRecord = {
      ...record,
      simulation_pcb_transient_channel_simulation_id,
    }
    const { simulation_pcb_driver_receiver_channel_id: previousChannelId } =
      signal
    if (previousChannelId) {
      channelRecords.delete(previousChannelId)
      Object.assign(channelRecord, {
        simulation_pcb_driver_receiver_channel_id: previousChannelId,
      })
    }
    signal.simulation_pcb_driver_receiver_channel_id =
      channelRecords.insert(
        channelRecord,
      ).simulation_pcb_driver_receiver_channel_id
  }
}
