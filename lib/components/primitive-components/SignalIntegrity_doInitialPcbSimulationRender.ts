import type { SignalEndpoint as SignalEndpointProps } from "@tscircuit/props"
import type { SimulationSignal, SourcePort } from "circuit-json"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import { getSignalTopology } from "lib/utils/simulation/get-signal-topology"
import type { Signal } from "./Signal"
import type { SignalIntegrity } from "./SignalIntegrity"

type SourcePortId = SourcePort["source_port_id"]

// FNV-1a: independent of block, JSX order and process, with a nonzero seed.
function getSignalSeed(name: string) {
  let hash = 2166136261
  for (let i = 0; i < name.length; i++)
    hash = Math.imul(hash ^ name.charCodeAt(i), 16777619)
  return hash >>> 0 || 1
}

function getPatternLength(pattern: string) {
  if (pattern === "clock") return 2
  if (pattern === "prbs7") return 2 ** 7 - 1
  if (pattern === "prbs15") return 2 ** 15 - 1
  if (pattern === "prbs31") return 2 ** 31 - 1
  return pattern.length
}

/** All IBIS declarations and PCB routes have finished before this phase. */
export function SignalIntegrity_doInitialPcbSimulationRender(
  block: SignalIntegrity,
): void {
  const { db } = block.root!
  const props = block._parsedProps
  // Invalid JSX props become ErrorPlaceholders in the reconciler. Preserve the
  // RFC diagnostic instead of replacing it with an empty-block error.
  if (
    block.children.some(
      (child) =>
        child.props.componentType === "signal" &&
        typeof child.props.quiet === "boolean",
    )
  )
    throw new Error('quiet needs a level: "low", "high" or "off".')
  const board = block._getBoard()
  const blocks = board
    ?.selectAll<SignalIntegrity>("signalintegrity")
    .filter((candidate) => !candidate.shouldBeRemoved) ?? [block]
  if (
    blocks.length > 1 &&
    blocks.some((candidate) => !candidate._parsedProps.name)
  )
    throw new Error(
      `This board has ${blocks.length} <signalintegrity> blocks; give each a name.`,
    )
  if (
    !board?.pcb_board_id ||
    !db.pcb_stackup.getWhere({ pcb_board_id: board.pcb_board_id })
  )
    throw new Error(
      "<signalintegrity> needs a stackup: set fabricatorPreset or define one.",
    )

  const signals = block.children.filter(
    (child): child is Signal =>
      child.componentName === "Signal" && !child.shouldBeRemoved,
  )
  if (
    signals.length !==
      block.children.filter((child) => !child.shouldBeRemoved).length ||
    signals.length === 0
  )
    throw new Error("<signalintegrity> must contain <signal> elements.")
  const names = signals.map((signal) => signal._parsedProps.name)
  if (new Set(names).size !== names.length)
    throw new Error(
      "Signal names must be unique within a <signalintegrity> block.",
    )
  const topology = getSignalTopology(block)
  const models = db.simulation_ibis_model.list()
  const modelForPort = (portId: SourcePortId) =>
    models.find((model) =>
      Object.values(model.ibis_pin_name_to_source_port_id).includes(portId),
    )
  const describePort = (port: SourcePort) => {
    const component =
      port.source_component_id &&
      db.source_component.get(port.source_component_id)
    return `.${component ? component.name : "unnamed component"} > .${port.most_frequently_referenced_by_name ?? port.name}`
  }
  const getPortModelInfo = (portId: SourcePortId, override?: string) => {
    const model = modelForPort(portId)
    const info =
      model && block.ibisModelInfoByUrl.get(model.ibis_model_asset.url)
    const component = model && info?.components.get(model.ibis_component_name)
    const pin =
      model &&
      Object.entries(model.ibis_pin_name_to_source_port_id).find(
        ([, id]) => id === portId,
      )?.[0]
    const modelName =
      override ??
      (pin && model?.ibis_pin_name_to_model_name?.[pin]) ??
      (pin && component?.pinModels.get(pin))
    return { model, info, component, pin, modelName }
  }
  const resolveEndpoint = (
    signal: Signal,
    endpoint: SignalEndpointProps,
    role: "driver" | "receiver",
  ) => {
    const pin =
      typeof endpoint === "object" && "pin" in endpoint
        ? endpoint.pin
        : endpoint
    const override =
      typeof endpoint === "object" && "pin" in endpoint
        ? endpoint.model
        : undefined
    const selectors = typeof pin === "string" ? [pin] : [pin.p, pin.n]
    const ports = selectors.map((selector) => {
      const port = resolveExternalSimulationPort({
        declaration: block,
        selector,
      })
      if (!modelForPort(port.source_port_id!))
        throw new Error(
          `Signal "${signal._parsedProps.name}" ${role} ${selector} has no <ibismodel>.`,
        )
      return port.source_port_id!
    })
    if (ports.length === 2) {
      if (ports[0] === ports[1])
        throw new Error(
          `Signal "${signal._parsedProps.name}" needs two different differential pins.`,
        )
      const positive = getPortModelInfo(ports[0]),
        negative = getPortModelInfo(ports[1])
      if (
        positive.component &&
        positive.pin &&
        [...positive.component.differentialPins.values()].includes(positive.pin)
      )
        throw new Error(
          `Signal "${signal._parsedProps.name}": ${selectors[0]} is the inverting pin; swap p and n.`,
        )
      if (
        positive.component?.differentialPins.size &&
        (positive.model !== negative.model ||
          positive.component.differentialPins.get(positive.pin!) !==
            negative.pin)
      )
        throw new Error(
          `Signal "${signal._parsedProps.name}" endpoints must match an IBIS [Diff_pin] pair.`,
        )
    }
    const record: SimulationSignal["driver"] =
      ports.length === 1
        ? {
            kind: "single",
            source_port_id: ports[0],
            ...(override ? { ibis_model_name: override } : {}),
          }
        : {
            kind: "differential",
            p_source_port_id: ports[0],
            n_source_port_id: ports[1],
            ...(override ? { ibis_model_name: override } : {}),
          }
    return { ports, selectors, record }
  }
  const resolved = signals.map((signal) => {
    const signalProps = signal._parsedProps
    if (signalProps.strobe && !names.includes(signalProps.strobe))
      throw new Error(
        `Signal "${signalProps.name}" strobe "${signalProps.strobe}" is not a signal in block "${props.name ?? "unnamed"}".`,
      )
    if (
      !signalProps.strobe &&
      signalProps.mask !== "ibis" &&
      (signalProps.mask.setup !== undefined ||
        signalProps.mask.hold !== undefined)
    )
      throw new Error("mask.setup and mask.hold need a strobe.")
    const driver = resolveEndpoint(signal, signalProps.driver, "driver")
    const receivers = (
      Array.isArray(signalProps.receiver)
        ? signalProps.receiver
        : [signalProps.receiver]
    ).map((receiver) => resolveEndpoint(signal, receiver, "receiver"))
    if (
      receivers.some(
        (receiver) => receiver.ports.length !== driver.ports.length,
      )
    )
      throw new Error(
        `Signal "${signalProps.name}" driver and receivers must use the same endpoint kind.`,
      )
    const ports = topology.ports.filter((port) =>
      driver.ports.some((driverId) =>
        topology.connected(driverId, port.source_port_id),
      ),
    )
    return { signal, driver, receivers, ports }
  })

  for (let i = 0; i < resolved.length; i++) {
    const { signal, driver, receivers, ports } = resolved[i]
    const name = signal._parsedProps.name
    for (const other of resolved.slice(i + 1))
      if (
        driver.ports.some((portId) =>
          other.driver.ports.some((otherId) =>
            topology.connected(portId, otherId),
          ),
        )
      )
        throw new Error(
          `Signals "${name}" and "${other.signal._parsedProps.name}" are on the same net; one signal per net.`,
        )
    for (const port of ports) {
      if (driver.ports.includes(port.source_port_id)) continue
      const info = getPortModelInfo(port.source_port_id)
      const modelName =
        info.info?.modelSelectors.get(info.modelName!) ?? info.modelName
      if (
        (port.is_output && !port.is_bidirectional && !port.can_use_tri_state) ||
        (modelName && info.info?.modelTypes.get(modelName) === "output")
      )
        throw new Error(
          `Signal "${name}" has two drivers: ${driver.selectors[0]} and ${describePort(port)}. Exactly one pin drives a signal.`,
        )
    }
    for (const receiver of receivers) {
      for (let leg = 0; leg < receiver.ports.length; leg++) {
        if (!topology.connected(driver.ports[leg], receiver.ports[leg]))
          throw new Error(
            `Receiver ${receiver.selectors[leg]} is not connected to the copper of signal "${name}".`,
          )
        if (
          props.unrouted === "error" &&
          !topology.routed.areIdsConnected(
            driver.ports[leg],
            receiver.ports[leg],
          )
        )
          throw new Error(
            `Signal "${name}" is not routed between ${driver.selectors[leg]} and ${receiver.selectors[leg]}.`,
          )
      }
    }
    if (props.unrouted === "error") {
      const unroutedPort = ports.find(
        (port) =>
          port.source_component_id &&
          !driver.ports.some((driverId) =>
            topology.routed.areIdsConnected(driverId, port.source_port_id),
          ),
      )
      if (unroutedPort)
        throw new Error(
          `Signal "${name}" is not routed between ${driver.selectors[0]} and ${describePort(unroutedPort)}.`,
        )
    }
    for (const port of ports) {
      if (!port.source_component_id) continue
      const component = db.source_component.get(port.source_component_id)!
      if (
        models.some(
          (model) =>
            model.source_component_id === component.source_component_id,
        ) ||
        db.simulation_spice_subcircuit.getWhere({
          source_component_id: component.source_component_id,
        }) ||
        [
          "simple_resistor",
          "simple_capacitor",
          "simple_inductor",
          "simple_voltage_source",
          "simple_current_source",
          "simple_test_point",
        ].includes(component.ftype)
      )
        continue
      throw new Error(
        `.${component.name} is on signal "${name}" and has no SPICE or IBIS model.`,
      )
    }
  }

  const blockRecord = {
    name: props.name,
    bit_rate_bps: props.bitRate,
    duration_s:
      props.duration ??
      Math.max(
        ...signals.map(
          ({ _parsedProps: signal }) =>
            (getPatternLength(signal.pattern) + 16) /
            (signal.bitRate ?? props.bitRate),
        ),
      ),
    corner: props.corner,
    unlisted_nets: props.unlistedNets,
    unrouted: props.unrouted,
    pdn: props.pdn,
    supply: props.supply,
  }
  if (block.simulation_signal_integrity_id)
    db.simulation_signal_integrity.update(
      block.simulation_signal_integrity_id,
      blockRecord,
    )
  else
    block.simulation_signal_integrity_id =
      db.simulation_signal_integrity.insert(
        blockRecord,
      ).simulation_signal_integrity_id
  for (const { signal, driver, receivers } of resolved) {
    const { _parsedProps: signalProps } = signal
    const bitRate = signalProps.bitRate ?? props.bitRate
    const mask = signalProps.mask
    const record = {
      simulation_signal_integrity_id: block.simulation_signal_integrity_id,
      name: signalProps.name,
      driver: driver.record,
      receivers: receivers.map((receiver) => receiver.record),
      bit_rate_bps: bitRate,
      pattern: signalProps.pattern,
      seed: signalProps.seed ?? getSignalSeed(signalProps.name),
      offset_s:
        typeof signalProps.offset === "string"
          ? Number.parseFloat(signalProps.offset) / bitRate
          : signalProps.offset,
      quiet: signalProps.quiet,
      probe: signalProps.probe,
      mask:
        mask === "ibis"
          ? mask
          : {
              vih_v: mask.vih,
              vil_v: mask.vil,
              setup_s: mask.setup,
              hold_s: mask.hold,
            },
      strobe_simulation_signal_id: undefined,
    }
    if (signal.simulation_signal_id)
      db.simulation_signal.update(signal.simulation_signal_id, record)
    else
      signal.simulation_signal_id =
        db.simulation_signal.insert(record).simulation_signal_id
  }
  // Resolve forward references after all signals have stable IDs.
  for (const signal of signals) {
    const strobe = signals.find(
      (candidate) => candidate._parsedProps.name === signal._parsedProps.strobe,
    )
    if (strobe)
      db.simulation_signal.update(signal.simulation_signal_id!, {
        strobe_simulation_signal_id: strobe.simulation_signal_id!,
      })
  }
}
