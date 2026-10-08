import type {
  LayerRef,
  PcbPort,
  PcbTrace,
  SimulationReturnCurrentPortContact,
} from "circuit-json"
import type { PcbReturnCurrentExcitation } from "./PcbReturnCurrentExcitation"
import type { PcbReturnCurrentSimulation } from "./PcbReturnCurrentSimulation"
import type { Net } from "./Net"
import type { Port } from "./Port"
import type { Trace } from "./Trace/Trace"

const positionToleranceMm = 1e-6

/**
 * Contacts are points in emitted board-world coordinates: right-handed,
 * +X right, +Y toward the board top, +Z above the board, millimeters.
 * Copying emitted PCB ports avoids reapplying footprint rotation or mirroring.
 */
export function PcbReturnCurrentExcitation_doInitialPcbSimulationRender(
  excitation: PcbReturnCurrentExcitation,
): void {
  if (excitation.root?.pcbDisabled) return
  const { db } = excitation.root!
  const props = excitation._parsedProps
  const simulation = excitation.parent as PcbReturnCurrentSimulation | null
  if (simulation?.componentName !== "PcbReturnCurrentSimulation") {
    excitation.renderError(
      "A PCB return-current excitation must be directly inside a PCB return-current simulation.",
    )
    return
  }
  if (!simulation.simulation_experiment_id) {
    excitation.renderError(
      "The PCB return-current simulation has not been declared.",
    )
    return
  }

  const subcircuit = excitation.getSubcircuit()
  const resolvePcbPort = (selector: string, role: string): PcbPort => {
    const ports = subcircuit
      .selectAll<Port>(selector)
      .filter((component) => component.componentName === "Port")
    if (ports.length !== 1) {
      excitation.renderError(
        `${role} selector "${selector}" must identify exactly one physical PCB port.`,
      )
    }
    const port = ports[0]
    const pcbPort = port?.pcb_port_id ? db.pcb_port.get(port.pcb_port_id) : null
    const hasPhysicalPad =
      pcbPort &&
      (db.pcb_smtpad.list({ pcb_port_id: pcbPort.pcb_port_id }).length > 0 ||
        db.pcb_plated_hole.list({ pcb_port_id: pcbPort.pcb_port_id }).length >
          0)
    if (!pcbPort || !hasPhysicalPad) {
      excitation.renderError(
        `${role} selector "${selector}" needs a physical PCB pad or plated-hole port.`,
      )
    }
    return pcbPort!
  }

  const signalSource = resolvePcbPort(props.source, "Signal source")
  const signalLoad = resolvePcbPort(props.load, "Signal load")
  const returnSource = resolvePcbPort(
    props.returnSource,
    "Return source (load-side ground)",
  )
  const returnSink = resolvePcbPort(
    props.returnSink,
    "Return sink (driver-side ground)",
  )
  if (
    new Set([
      signalSource.pcb_port_id,
      signalLoad.pcb_port_id,
      returnSource.pcb_port_id,
      returnSink.pcb_port_id,
    ]).size !== 4
  ) {
    excitation.renderError(
      "Signal source, signal load, return source and return sink must be four distinct physical PCB ports.",
    )
  }

  const groundNets = subcircuit
    .selectAll<Net>(props.ground.startsWith("net.") ? "net" : props.ground)
    .filter(
      (component) =>
        component.componentName === "Net" &&
        (!props.ground.startsWith("net.") ||
          component.getPortSelector() === props.ground),
    )
  if (groundNets.length !== 1 || !groundNets[0].source_net_id) {
    excitation.renderError(
      `Ground selector "${props.ground}" must identify exactly one source net.`,
    )
  }
  const groundNet = db.source_net.get(groundNets[0].source_net_id!)!
  const groundConnectivityKey = groundNet.subcircuit_connectivity_map_key
  for (const [pcbPort, selector] of [
    [signalSource, props.source],
    [signalLoad, props.load],
  ] as const) {
    if (
      groundConnectivityKey &&
      db.source_port.get(pcbPort.source_port_id)
        ?.subcircuit_connectivity_map_key === groundConnectivityKey
    ) {
      excitation.renderError(
        `Signal terminal "${selector}" is electrically connected to ground net "${groundNet.name}".`,
      )
    }
  }
  for (const [pcbPort, selector] of [
    [returnSource, props.returnSource],
    [returnSink, props.returnSink],
  ] as const) {
    const sourcePort = db.source_port.get(pcbPort.source_port_id)
    if (
      !groundConnectivityKey ||
      sourcePort?.subcircuit_connectivity_map_key !== groundConnectivityKey
    ) {
      excitation.renderError(
        `Return contact "${selector}" is not electrically connected to ground net "${groundNet.name}".`,
      )
    }
  }

  const contact = (
    pcbPort: PcbPort,
    selector: string,
    requestedLayer: LayerRef | undefined,
    role: string,
  ): SimulationReturnCurrentPortContact => {
    const layers = [...new Set(pcbPort.layers)]
    if (!requestedLayer && layers.length !== 1) {
      excitation.renderError(
        `${role} "${selector}" spans multiple layers; specify ${role === "Return source" ? "returnSourceLayer" : "returnSinkLayer"}.`,
      )
    }
    const layer = requestedLayer ?? layers[0]
    if (!layers.includes(layer)) {
      excitation.renderError(
        `${role} "${selector}" has no physical port on layer "${layer}".`,
      )
    }
    return {
      contact_type: "pcb_port",
      pcb_port_id: pcbPort.pcb_port_id,
      x: pcbPort.x,
      y: pcbPort.y,
      layer,
    }
  }
  const returnSourceContact = contact(
    returnSource,
    props.returnSource,
    props.returnSourceLayer,
    "Return source",
  )
  const returnSinkContact = contact(
    returnSink,
    props.returnSink,
    props.returnSinkLayer,
    "Return sink",
  )
  for (const [signalPort, referenceContact] of [
    [signalSource, returnSinkContact],
    [signalLoad, returnSourceContact],
  ] as const) {
    if (
      Math.hypot(
        signalPort.x - referenceContact.x,
        signalPort.y - referenceContact.y,
      ) <= positionToleranceMm &&
      signalPort.layers.includes(referenceContact.layer)
    ) {
      excitation.renderError(
        "A signal terminal and its ground reference must occupy different physical PCB locations on the same layer.",
      )
    }
  }

  let selectedSourceTraceId: Trace["source_trace_id"] | undefined
  if (props.trace) {
    const traces = subcircuit
      .selectAll<Trace>(props.trace)
      .filter((component) => component.componentName === "Trace")
    if (traces.length !== 1 || !traces[0].source_trace_id) {
      excitation.renderError(
        `Trace selector "${props.trace}" must identify exactly one routed source trace.`,
      )
    }
    selectedSourceTraceId = traces[0].source_trace_id
  }

  const endpointMatches = (
    endpoint: PcbTrace["route"][number] | undefined,
    pcbPort: PcbPort,
    end: "start" | "end",
  ) =>
    endpoint?.route_type === "wire" &&
    Math.hypot(endpoint.x - pcbPort.x, endpoint.y - pcbPort.y) <=
      positionToleranceMm &&
    pcbPort.layers.includes(endpoint.layer) &&
    (!endpoint[`${end}_pcb_port_id`] ||
      endpoint[`${end}_pcb_port_id`] === pcbPort.pcb_port_id)

  const traces = db.pcb_trace.list().filter((pcbTrace) => {
    if (pcbTrace.subcircuit_id !== subcircuit.subcircuit_id) return false
    if (
      selectedSourceTraceId &&
      pcbTrace.source_trace_id !== selectedSourceTraceId
    )
      return false
    const sourceTrace = pcbTrace.source_trace_id
      ? db.source_trace.get(pcbTrace.source_trace_id)
      : null
    if (
      !sourceTrace ||
      sourceTrace.connected_source_port_ids.length !== 2 ||
      !sourceTrace.connected_source_port_ids.includes(
        signalSource.source_port_id,
      ) ||
      !sourceTrace.connected_source_port_ids.includes(signalLoad.source_port_id)
    )
      return false
    const first = pcbTrace.route[0]
    const last = pcbTrace.route.at(-1)
    return (
      (endpointMatches(first, signalSource, "start") &&
        endpointMatches(last, signalLoad, "end")) ||
      (endpointMatches(first, signalLoad, "start") &&
        endpointMatches(last, signalSource, "end"))
    )
  })
  if (traces.length !== 1) {
    excitation.renderError(
      `The connection from "${props.source}" to "${props.load}" must have exactly one complete routed PCB trace${props.trace ? ` selected by "${props.trace}"` : "; use trace to disambiguate multiple routes"}. Split or branched routes are not supported.`,
    )
  }

  const previousExcitations = db.simulation_return_current_excitation.list({
    simulation_experiment_id: simulation.simulation_experiment_id,
  })
  if (
    previousExcitations.some(
      (previous) => previous.pcb_trace_id === traces[0].pcb_trace_id,
    )
  ) {
    excitation.renderError(
      "A PCB return-current simulation can excite each signal trace only once. Use separate experiments to compare different currents or directions.",
    )
  }
  if (
    previousExcitations.some(
      (previous) => previous.ground_source_net_id !== groundNet.source_net_id,
    )
  ) {
    excitation.renderError(
      "All excitations in a PCB return-current simulation must use the same ground net. Use separate experiments for different ground nets.",
    )
  }

  const inserted = db.simulation_return_current_excitation.insert({
    simulation_experiment_id: simulation.simulation_experiment_id,
    pcb_trace_id: traces[0].pcb_trace_id,
    ground_source_net_id: groundNet.source_net_id,
    current: props.current,
    return_source: returnSourceContact,
    return_sink: returnSinkContact,
    source_port: {
      signal_pcb_port_id: signalSource.pcb_port_id,
      reference_pcb_port_id: returnSink.pcb_port_id,
      reference_layer: returnSinkContact.layer,
      resistance: props.sourceImpedance,
    },
    load_port: {
      signal_pcb_port_id: signalLoad.pcb_port_id,
      reference_pcb_port_id: returnSource.pcb_port_id,
      reference_layer: returnSourceContact.layer,
      resistance: props.loadImpedance,
    },
  })
  excitation.simulation_return_current_excitation_id =
    inserted.simulation_return_current_excitation_id
}
