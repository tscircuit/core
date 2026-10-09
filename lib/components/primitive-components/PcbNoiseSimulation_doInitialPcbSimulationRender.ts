import { simulation_pcb_noise_configuration } from "circuit-json"
import {
  resolvePhysicalPcbPort,
  resolvePhysicalPcbPortContact,
} from "lib/utils/pcb-simulation/resolve-physical-pcb-port"
import { PcbNoiseDeclaration } from "./PcbNoiseDeclaration"
import { PcbNoisePort } from "./PcbNoisePort"
import { PcbNoiseExcitation } from "./PcbNoiseExcitation"
import { PcbNoiseTermination } from "./PcbNoiseTermination"
import { PcbNoiseObservation } from "./PcbNoiseObservation"
import { PcbNoiseEye } from "./PcbNoiseEye"
import type { PcbNoiseSimulation } from "./PcbNoiseSimulation"

/** Physical contacts use emitted board-world points in mm; see shared resolver. */
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
  if (children.some((child) => !(child instanceof PcbNoiseDeclaration))) {
    simulation.renderError(
      "A PCB noise simulation can contain only noise ports, excitations, terminations, observations and eyes.",
    )
  }
  const ports = children
    .filter((child): child is PcbNoisePort => child instanceof PcbNoisePort)
    .map((port) => {
      const portProps = port._parsedProps
      const signal = resolvePhysicalPcbPort(port, portProps.signal, "Signal")
      const reference = resolvePhysicalPcbPort(
        port,
        portProps.reference,
        "Reference",
      )
      const signalContact = resolvePhysicalPcbPortContact(
        port,
        signal,
        portProps.signal,
        portProps.signalLayer,
        "Signal",
        "signalLayer",
      )
      const referenceContact = resolvePhysicalPcbPortContact(
        port,
        reference,
        portProps.reference,
        portProps.referenceLayer,
        "Reference",
        "referenceLayer",
      )
      if (
        signalContact.layer === referenceContact.layer &&
        Math.hypot(
          signalContact.x - referenceContact.x,
          signalContact.y - referenceContact.y,
        ) <= 1e-6
      ) {
        port.renderError(
          `Noise port "${portProps.name}" needs different physical signal and reference contacts on the same layer.`,
        )
      }
      return {
        name: portProps.name,
        signal_contact: signalContact,
        reference_contact: referenceContact,
      }
    })
  const sources = children
    .filter(
      (child): child is PcbNoiseExcitation =>
        child instanceof PcbNoiseExcitation,
    )
    .map((excitation) => {
      const sourceProps = excitation._parsedProps
      const waveform = sourceProps.waveform
      return {
        name: sourceProps.name ?? `${sourceProps.port}_source`,
        port_name: sourceProps.port,
        role: sourceProps.role,
        source_model: {
          kind: sourceProps.sourceModel.kind,
          resistance_ohms: sourceProps.sourceModel.resistance,
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
      }
    })
  const terminations = children
    .filter(
      (child): child is PcbNoiseTermination =>
        child instanceof PcbNoiseTermination,
    )
    .map((termination) => {
      const terminationProps = termination._parsedProps
      const model = terminationProps.model
      return {
        name: terminationProps.name ?? `${terminationProps.port}_termination`,
        port_name: terminationProps.port,
        model: {
          kind: model.kind,
          resistance_ohms: model.resistance,
          bias_voltage_v: model.biasVoltage,
          ...(model.kind === "parallel_rc"
            ? { capacitance_f: model.capacitance }
            : {}),
        },
      }
    })
  const observations = children
    .filter(
      (child): child is PcbNoiseObservation =>
        child instanceof PcbNoiseObservation,
    )
    .map((observation) => {
      const observationProps = observation._parsedProps
      return {
        name: observationProps.name,
        port_name: observationProps.port,
        quantity: observationProps.quantity,
      }
    })
  const eyes = children
    .filter((child): child is PcbNoiseEye => child instanceof PcbNoiseEye)
    .map((eye) => {
      const eyeProps = eye._parsedProps
      const timing = eyeProps.timing
      return {
        observation_name: eyeProps.observation,
        modulation: eyeProps.modulation,
        timing:
          timing.kind === "known_ui"
            ? {
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
            : {
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
              },
      }
    })
  const configuration = simulation_pcb_noise_configuration.safeParse({
    type: "simulation_pcb_noise_configuration",
    simulation_pcb_noise_configuration_id:
      simulation.simulation_pcb_noise_configuration_id ?? "pending",
    simulation_experiment_id: simulation.simulation_experiment_id,
    pcb_board_id: board.pcb_board_id,
    duration_s: props.duration,
    sample_interval_s: props.sampleInterval,
    ports,
    sources,
    terminations,
    observations,
    ...(eyes.length ? { eyes } : {}),
    ...(props.baseline
      ? {
          baseline: {
            kind: props.baseline.kind,
            source_names: props.baseline.sourceNames,
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
