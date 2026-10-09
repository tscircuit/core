import {
  type SimulationPcbNoiseEyeTiming,
  simulation_pcb_noise_configuration,
} from "circuit-json"
import {
  resolvePhysicalPcbPort,
  resolvePhysicalPcbPortContact,
} from "lib/utils/pcb-simulation/resolve-physical-pcb-port"
import { PcbNoiseChannel } from "./PcbNoiseChannel"
import { PcbNoiseEye } from "./PcbNoiseEye"
import type { PcbNoiseSimulation } from "./PcbNoiseSimulation"

/** Physical contacts use emitted board-world points in mm; see shared resolver. */
function resolveChannelPort(channel: PcbNoiseChannel, end: "source" | "load") {
  const props = channel._parsedProps
  const signal = resolvePhysicalPcbPort(channel, props[end], `${end} signal`)
  const reference = resolvePhysicalPcbPort(
    channel,
    props[`${end}Reference`],
    `${end} reference`,
  )
  const signalContact = resolvePhysicalPcbPortContact(
    channel,
    signal,
    props[end],
    props[`${end}Layer`],
    `${end} signal`,
    `${end}Layer`,
  )
  const referenceContact = resolvePhysicalPcbPortContact(
    channel,
    reference,
    props[`${end}Reference`],
    props[`${end}ReferenceLayer`],
    `${end} reference`,
    `${end}ReferenceLayer`,
  )
  if (
    signalContact.layer === referenceContact.layer &&
    Math.hypot(
      signalContact.x - referenceContact.x,
      signalContact.y - referenceContact.y,
    ) <= 1e-6
  )
    channel.renderError(
      `Noise channel "${props.name}" needs different physical signal and reference contacts.`,
    )
  return {
    name: `${props.name}_${end === "source" ? "tx" : "rx"}`,
    signal_contact: signalContact,
    reference_contact: referenceContact,
  }
}

/** Compact channels expand after copper into explicit canonical physical models. */
export function PcbNoiseSimulation_doInitialPcbSimulationRender(
  simulation: PcbNoiseSimulation,
): void {
  if (simulation.root?.pcbDisabled) return
  const { db } = simulation.root!
  const props = simulation._parsedProps
  const board = simulation._getBoard()
  if (!board?.pcb_board_id || !simulation.simulation_experiment_id) {
    simulation.renderError(
      "A PCB noise simulation requires a physical PCB board.",
    )
    return
  }
  const children = simulation.children.filter((child) => !child.shouldBeRemoved)
  if (
    children.some(
      (child) =>
        !(child instanceof PcbNoiseChannel) && !(child instanceof PcbNoiseEye),
    )
  ) {
    simulation.renderError(
      "A PCB noise simulation can contain only noise channels and eyes.",
    )
  }
  const channels = children.filter(
    (child): child is PcbNoiseChannel => child instanceof PcbNoiseChannel,
  )
  const models = channels.map((channel) => {
    const channelProps = channel._parsedProps
    const waveform = channelProps.waveform
    return {
      ports: [
        resolveChannelPort(channel, "source"),
        resolveChannelPort(channel, "load"),
      ],
      source: {
        name: `${channelProps.name}_source`,
        port_name: `${channelProps.name}_tx`,
        role: channelProps.role,
        source_model: {
          kind: "thevenin",
          resistance_ohms: channelProps.sourceImpedance,
        },
        waveform:
          waveform.kind === "dc"
            ? { kind: waveform.kind, voltage_v: waveform.voltage }
            : {
                kind: waveform.kind,
                order: waveform.order,
                baud_rate_hz: waveform.baudRate,
                low_voltage_v: waveform.lowVoltage,
                high_voltage_v: waveform.highVoltage,
                rise_time_s: waveform.riseTime,
                fall_time_s: waveform.fallTime,
                edge_time_convention: waveform.edgeTimeConvention,
                seed: waveform.seed,
                algorithm: waveform.algorithm,
                algorithm_version: waveform.algorithmVersion,
              },
      },
      termination: {
        name: `${channelProps.name}_load`,
        port_name: `${channelProps.name}_rx`,
        model: {
          kind:
            channelProps.loadCapacitance === undefined
              ? "resistor"
              : "parallel_rc",
          resistance_ohms: channelProps.loadImpedance,
          bias_voltage_v: channelProps.loadBiasVoltage,
          ...(channelProps.loadCapacitance === undefined
            ? {}
            : { capacitance_f: channelProps.loadCapacitance }),
        },
      },
      observations: (["voltage", "current"] as const).flatMap((quantity) =>
        (["source", "load"] as const).map((end) => ({
          name: `${channelProps.name}_${end}_${quantity}`,
          port_name: `${channelProps.name}_${end === "source" ? "tx" : "rx"}`,
          quantity,
        })),
      ),
    }
  })
  const eyes = children
    .filter((child): child is PcbNoiseEye => child instanceof PcbNoiseEye)
    .map((eye) => {
      const eyeProps = eye._parsedProps
      const dataChannel = channels.find(
        (channel) => channel._parsedProps.name === eyeProps.channel,
      )
      if (!dataChannel)
        eye.renderError(`Unknown eye channel "${eyeProps.channel}".`)
      if (dataChannel!._parsedProps.waveform.kind !== "prbs")
        eye.renderError(
          `Eye channel "${eyeProps.channel}" must have an active PRBS waveform.`,
        )
      const timing = eyeProps.timing
      let resolvedTiming: SimulationPcbNoiseEyeTiming
      if (timing.kind === "source") {
        const clockChannel = channels.find(
          (channel) => channel._parsedProps.name === timing.channel,
        )
        if (!clockChannel)
          eye.renderError(`Unknown timing channel "${timing.channel}".`)
        const waveform = clockChannel!._parsedProps.waveform
        if (waveform.kind !== "prbs") {
          eye.renderError(
            `Timing channel "${timing.channel}" must have a PRBS waveform.`,
          )
          return
        }
        if (timing.sampleOffset >= 1 / waveform.baudRate)
          eye.renderError(
            `Eye sampleOffset must be less than the unit interval of timing channel "${timing.channel}".`,
          )
        resolvedTiming = {
          kind: "explicit_clock",
          clock: {
            kind: "authored_edges",
            source_name: `${timing.channel}_source`,
          },
          edge: "rising",
          threshold_v: waveform.lowVoltage / 2 + waveform.highVoltage / 2,
          ui_per_selected_edge: 1,
          sample_offset_s: timing.sampleOffset,
          interpretation: "nominal_reference",
        }
      } else if (timing.kind === "known_ui") {
        resolvedTiming = {
          kind: timing.kind,
          unit_interval_s: timing.unitInterval,
          sample_offset_s: timing.sampleOffset,
          origin:
            timing.origin.kind === "authored_epoch"
              ? { kind: timing.origin.kind, epoch_s: timing.origin.epoch }
              : {
                  kind: timing.origin.kind,
                  training_interval: {
                    start_s: timing.origin.trainingInterval.start,
                    end_s: timing.origin.trainingInterval.end,
                  },
                },
        }
      } else {
        resolvedTiming = {
          kind: timing.kind,
          clock:
            timing.clock.kind === "observation"
              ? {
                  kind: timing.clock.kind,
                  observation_name: timing.clock.clockObservation,
                }
              : {
                  kind: timing.clock.kind,
                  source_name: timing.clock.edgeSource,
                },
          edge: timing.edge,
          threshold_v: timing.threshold,
          ui_per_selected_edge: timing.uiPerSelectedEdge,
          sample_offset_s: timing.sampleOffset,
          interpretation: timing.interpretation,
        }
      }
      return {
        observation_name: `${eyeProps.channel}_load_voltage`,
        modulation: "nrz",
        timing: resolvedTiming,
      }
    })
  if (props.baseline) {
    for (const name of props.baseline.quietChannels) {
      const channel = channels.find(
        (channel) => channel._parsedProps.name === name,
      )
      if (!channel)
        simulation.renderError(`Unknown baseline channel "${name}".`)
      if (channel!._parsedProps.role !== "aggressor")
        simulation.renderError(
          `Baseline channel "${name}" must be an aggressor.`,
        )
    }
  }
  const configuration = simulation_pcb_noise_configuration.safeParse({
    type: "simulation_pcb_noise_configuration",
    simulation_pcb_noise_configuration_id:
      simulation.simulation_pcb_noise_configuration_id ?? "pending",
    simulation_experiment_id: simulation.simulation_experiment_id,
    pcb_board_id: board.pcb_board_id,
    duration_s: props.duration,
    sample_interval_s: props.sampleInterval,
    ports: models.flatMap((model) => model.ports),
    sources: models.map((model) => model.source),
    terminations: models.map((model) => model.termination),
    observations: models.flatMap((model) => model.observations),
    ...(eyes.length ? { eyes } : {}),
    ...(props.baseline
      ? {
          baseline: {
            kind: "quiet_sources",
            source_names: props.baseline.quietChannels.map(
              (name) => `${name}_source`,
            ),
            voltage_v: props.baseline.voltage,
          },
        }
      : {}),
  })
  if (!configuration.success) {
    simulation.renderError(
      `Invalid PCB noise configuration: ${configuration.error.issues.map((issue) => issue.message).join("; ")}`,
    )
    return
  }
  const { type, simulation_pcb_noise_configuration_id, ...definition } =
    configuration.data
  if (simulation.simulation_pcb_noise_configuration_id) {
    db.simulation_pcb_noise_configuration.update(
      simulation.simulation_pcb_noise_configuration_id,
      definition,
    )
  } else {
    const inserted = db.simulation_pcb_noise_configuration.insert(definition)
    simulation.simulation_pcb_noise_configuration_id =
      inserted.simulation_pcb_noise_configuration_id
  }
}
