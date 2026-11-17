import type {
  SimulationPcbDriverReceiverChannel,
  SimulationPcbTransientChannelSimulation,
} from "circuit-json"
import { simulationTimeToMilliseconds } from "lib/utils/simulation/simulation-time-to-milliseconds"
import type { SimulationEyeDiagram } from "./SimulationEyeDiagram"

type TransientSimulationId =
  SimulationPcbTransientChannelSimulation["simulation_pcb_transient_channel_simulation_id"]

export function SimulationEyeDiagram_getRecords(
  eye: SimulationEyeDiagram,
  simulationId: TransientSimulationId,
) {
  const { name, channelRef, startTime, endTime } = eye._parsedProps
  const channels = eye.root!.db.simulation_pcb_driver_receiver_channel.list({
    simulation_pcb_transient_channel_simulation_id: simulationId,
  })
  for (const channelName of channelRef ?? []) {
    if (!channels.some((channel) => channel.name === channelName))
      throw new Error(
        `Eye diagram "${name}" references unknown channel "${channelName}".`,
      )
  }

  // A record has one window. Group channels by rate when that window uses UI.
  const usesUnitIntervals =
    (typeof startTime === "string" && startTime !== "0UI") ||
    typeof endTime === "string"
  const channelsByWindowRate = new Map<
    number,
    SimulationPcbDriverReceiverChannel[]
  >()
  for (const channel of channels) {
    if (channelRef && !channelRef.includes(channel.name)) continue
    if (channel.driver_disabled || /^(?:0+|1+)$/.test(channel.pattern)) continue
    const rate = usesUnitIntervals ? channel.bit_rate_bps : 0
    const group = channelsByWindowRate.get(rate)
    if (group) group.push(channel)
    else channelsByWindowRate.set(rate, [channel])
  }

  return [...channelsByWindowRate.values()].map((group) => {
    const rate = group[0].bit_rate_bps
    const startMs =
      startTime === undefined
        ? undefined
        : simulationTimeToMilliseconds(startTime, rate)
    const endMs =
      endTime === undefined
        ? undefined
        : simulationTimeToMilliseconds(endTime, rate)
    if (
      (startMs !== undefined && !Number.isFinite(startMs)) ||
      (endMs !== undefined &&
        (!Number.isFinite(endMs) || endMs <= (startMs ?? 0)))
    )
      throw new Error(
        `Eye diagram "${name}" must have a finite window with the end after the start.`,
      )
    const channelIds = group.map(
      (channel) => channel.simulation_pcb_driver_receiver_channel_id,
    )
    return {
      name,
      simulation_pcb_transient_channel_simulation_id: simulationId,
      ...(channelRef || channelsByWindowRate.size > 1
        ? { simulation_pcb_driver_receiver_channel_ids: channelIds }
        : {}),
      ...(startMs === undefined ? {} : { start_time_ms: startMs }),
      ...(endMs === undefined ? {} : { end_time_ms: endMs }),
    }
  })
}
