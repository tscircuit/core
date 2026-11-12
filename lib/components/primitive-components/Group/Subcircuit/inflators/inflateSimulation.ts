import { getElementId } from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElementInput,
  SimulationExperiment,
  SimulationSignal,
  SourceComponentBase,
  SourceNet,
  SourcePort,
} from "circuit-json"
import { PcbChannel } from "lib/components/primitive-components/PcbChannel"
import { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { InflatorContext } from "../InflatorFn"

const ibisSimulationTypes = [
  "simulation_ibis_model",
  "simulation_ibis_pin_state",
  "simulation_digital_stimulus",
  "simulation_eye_diagram",
] as const

const siSimulationTypes = [
  "simulation_signal_integrity",
  "simulation_signal",
] as const

// Dependencies must precede records that reference them.
const simulationTypes = [
  "simulation_experiment",
  "simulation_voltage_probe",
  ...ibisSimulationTypes,
] as const

type SimulationReferenceId =
  | SourceComponentBase["source_component_id"]
  | SourcePort["source_port_id"]
  | SourceNet["source_net_id"]
  | SimulationExperiment["simulation_experiment_id"]

/** Restore records after inflated components have allocated their source IDs. */
class InflatedSimulation extends PrimitiveComponent {
  constructor(private inflationCtx: InflatorContext) {
    super({})
  }

  get config() {
    return { ...super.config, componentName: "InflatedSimulation" }
  }

  doInitialSimulationRender() {
    if (this.getInheritedProperty("analogSimulationDisabled")) return
    restoreSimulationRecords(this.inflationCtx)
  }
}

function restoreSimulationRecords({
  injectionDb,
  subcircuit,
  groupsMap,
}: InflatorContext) {
  const { db } = subcircuit.root!
  const eyes = injectionDb.simulation_eye_diagram.list()
  const experimentIds = new Set(
    [
      ...injectionDb.simulation_ibis_pin_state.list(),
      ...injectionDb.simulation_digital_stimulus.list(),
      ...eyes,
    ].map((record) => record.simulation_experiment_id),
  )
  const probeIds = new Set(eyes.map((eye) => eye.simulation_voltage_probe_id))
  const restoredIds = new Map<SimulationReferenceId, SimulationReferenceId>()

  const remapId = (
    originalId: SimulationReferenceId,
    field: string,
  ): SimulationReferenceId => {
    const restoredId = restoredIds.get(originalId)
    if (restoredId) return restoredId

    let matchedId: SimulationReferenceId | undefined
    if (field === "subcircuit_id") {
      const sourceGroup = injectionDb.source_group
        .list()
        .find((group) => group.subcircuit_id === originalId)
      const group = sourceGroup && groupsMap?.get(sourceGroup.source_group_id)
      matchedId = group?.getSubcircuit().subcircuit_id ?? undefined
    } else if (field === "source_component_id") {
      const original = injectionDb.source_component.get(originalId)
      const group = original?.source_group_id
        ? groupsMap?.get(original.source_group_id)
        : subcircuit
      if (original && group?.source_group_id) {
        const components = db.source_component.list({
          source_group_id: group.source_group_id,
          name: original.name,
        })
        if (components.length === 1)
          matchedId = components[0].source_component_id
      }
    } else if (field.endsWith("source_port_id")) {
      const original = injectionDb.source_port.get(originalId)
      // Group ports are not reliably reconstructed by the existing inflator.
      // Refuse to preserve a stale ID when there is no physical component pin.
      if (original?.source_component_id) {
        const componentId = remapId(
          original.source_component_id,
          "source_component_id",
        )
        const ports = db.source_port
          .list({ source_component_id: componentId })
          .filter((port) =>
            original.pin_number !== undefined
              ? port.pin_number === original.pin_number
              : port.name === original.name,
          )
        if (ports.length === 1) matchedId = ports[0].source_port_id
      }
    } else if (field.endsWith("source_net_id")) {
      const original = injectionDb.source_net.get(originalId)
      if (original) {
        const nets = db.source_net.list({
          name: original.name,
          subcircuit_id: original.subcircuit_id
            ? remapId(original.subcircuit_id, "subcircuit_id")
            : subcircuit.subcircuit_id,
        })
        if (nets.length === 1) matchedId = nets[0].source_net_id
      }
    }

    if (!matchedId) {
      throw new Error(
        `Cannot restore simulation records: unable to remap ${field} safely.`,
      )
    }
    restoredIds.set(originalId, matchedId)
    return matchedId
  }

  const remapReferences = (value: unknown, field: string): unknown => {
    if (typeof value === "string" && field.endsWith("_id"))
      return remapId(value, field)
    if (Array.isArray(value))
      return value.map((entry) => remapReferences(entry, field))
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          remapReferences(
            entry,
            field === "ibis_pin_name_to_source_port_id"
              ? "source_port_id"
              : key,
          ),
        ]),
      )
    }
    return value
  }

  for (const type of simulationTypes) {
    for (const record of injectionDb[type].list()) {
      // Main ignores cached simulation records. Restore only IBIS dependencies.
      if (
        (record.type === "simulation_experiment" &&
          !experimentIds.has(record.simulation_experiment_id)) ||
        (record.type === "simulation_voltage_probe" &&
          !probeIds.has(record.simulation_voltage_probe_id))
      )
        continue
      const primaryIdField = `${type}_id`
      const fields = Object.fromEntries(
        Object.entries(record).filter(([key]) => key !== primaryIdField),
      )
      // Only identifiers change; all other circuit-json fields are preserved.
      const restored = db.insert(
        remapReferences(fields, "") as AnyCircuitElementInput,
      )
      restoredIds.set(getElementId(record), getElementId(restored))
    }
  }
  const endpointSelector = (endpoint: SimulationSignal["driver"]) => {
    const describe = (portId: SourcePort["source_port_id"]) => {
      const port = db.source_port.get(portId)!
      const chip = db.source_component.get(port.source_component_id!)!
      return `.${chip.name} > .${port.name}`
    }
    const pin =
      "source_port_id" in endpoint
        ? describe(endpoint.source_port_id)
        : {
            p: describe(endpoint.p_source_port_id),
            n: describe(endpoint.n_source_port_id),
          }
    return pin
  }
  for (const record of injectionDb.simulation_signal_integrity.list()) {
    const block = new PcbTransientChannelSimulation({
      name: record.name,
      bitRate: record.bit_rate_bps,
      duration: record.duration_s,
      allowUnroutedTraces: record.allow_unrouted_traces,
    })
    subcircuit.add(block)
    for (const recordSignal of injectionDb.simulation_signal.list({
      simulation_signal_integrity_id: record.simulation_signal_integrity_id,
    })) {
      const endpoints = {
        driver: remapReferences(
          recordSignal.driver,
          "",
        ) as SimulationSignal["driver"],
        receivers: recordSignal.receivers.map(
          (receiver) =>
            remapReferences(receiver, "") as SimulationSignal["driver"],
        ),
      }
      const signal = new PcbChannel({
        name: recordSignal.name,
        driverRef: endpointSelector(endpoints.driver),
        receiverRef: endpoints.receivers.map(endpointSelector),
        bitRate: recordSignal.bit_rate_bps,
        pattern: recordSignal.pattern,
        seed: recordSignal.seed,
        offset: recordSignal.offset_s,
        driverDisabled: recordSignal.driver_disabled,
      })
      signal.restoredEndpoints = endpoints
      block.add(signal)
    }
  }
}

export function inflateSimulation(inflationCtx: InflatorContext) {
  if (
    !siSimulationTypes.some(
      (type) => inflationCtx.injectionDb[type].list().length > 0,
    ) &&
    !ibisSimulationTypes.some(
      (type) => inflationCtx.injectionDb[type].list().length > 0,
    )
  )
    return
  inflationCtx.subcircuit.add(new InflatedSimulation(inflationCtx))
}
