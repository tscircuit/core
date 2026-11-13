import type { PcbChannel } from "lib/components/primitive-components/PcbChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import type { resolveSignalEndpoint } from "./resolve-signal-endpoint"

export function writeSignalIntegrityRecords(
  block: PcbTransientChannelSimulation,
  signals: {
    signal: PcbChannel
    driver: ReturnType<typeof resolveSignalEndpoint>
    receivers: ReturnType<typeof resolveSignalEndpoint>[]
    seed: number | undefined
  }[],
) {
  const { db } = block.root!
  const props = block._parsedProps
  // Durations in UI resolve at the block bit rate, like signal offsets.
  const durationS =
    typeof props.duration === "string"
      ? Number.parseFloat(props.duration) / props.bitRate
      : props.duration
  if (durationS !== undefined && !(durationS > 0 && Number.isFinite(durationS)))
    throw new Error("duration must be finite and greater than zero.")
  const blockRecord = {
    ...(props.name === undefined ? {} : { name: props.name }),
    bit_rate_bps: props.bitRate,
    ...(durationS === undefined ? {} : { duration_s: durationS }),
    allow_unrouted_traces: props.allowUnroutedTraces,
  }
  // Updates merge fields; replace the record to clear omitted optional values.
  if (block.simulation_signal_integrity_id)
    db.simulation_signal_integrity.delete(block.simulation_signal_integrity_id)
  block.simulation_signal_integrity_id = db.simulation_signal_integrity.insert({
    ...blockRecord,
    ...(block.simulation_signal_integrity_id
      ? { simulation_signal_integrity_id: block.simulation_signal_integrity_id }
      : {}),
  }).simulation_signal_integrity_id
  for (const { signal, driver, receivers, seed } of signals) {
    const { _parsedProps: signalProps } = signal
    const bitRate = signalProps.bitRate ?? props.bitRate
    const record = {
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
      name: signalProps.name,
      driver: driver.record,
      receivers: receivers.map((receiver) => receiver.record),
      bit_rate_bps: bitRate,
      pattern: signalProps.pattern,
      ...(seed === undefined ? {} : { seed }),
      offset_s:
        typeof signalProps.offset === "string"
          ? Number.parseFloat(signalProps.offset) / bitRate
          : signalProps.offset,
      ...(signalProps.driverDisabled ? { driver_disabled: true } : {}),
    }
    if (signal.simulation_signal_id)
      db.simulation_signal.delete(signal.simulation_signal_id)
    signal.simulation_signal_id = db.simulation_signal.insert({
      ...record,
      ...(signal.simulation_signal_id
        ? { simulation_signal_id: signal.simulation_signal_id }
        : {}),
    }).simulation_signal_id
  }
}
