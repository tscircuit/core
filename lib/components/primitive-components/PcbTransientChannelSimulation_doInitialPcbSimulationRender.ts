import { getSignalIntegrityBlocks } from "lib/utils/simulation/get-signal-integrity-blocks"
import type { SignalEndpoint as SignalEndpointProps } from "@tscircuit/props"
import type { SimulationSignal, SourcePort } from "circuit-json"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import { getSignalTopology } from "lib/utils/simulation/get-signal-topology"
import { getSignalSeed } from "lib/utils/simulation/get-signal-seed"
import type { PcbChannel } from "./PcbChannel"
import type { PcbTransientChannelSimulation } from "./PcbTransientChannelSimulation"

type SourcePortId = SourcePort["source_port_id"]

/** All IBIS declarations and PCB routes have finished before this phase. */
export function PcbTransientChannelSimulation_doInitialPcbSimulationRender(
  block: PcbTransientChannelSimulation,
): void {
  const { db } = block.root!
  const props = block._parsedProps
  // Invalid JSX props become ErrorPlaceholders in the reconciler. Preserve the
  // seed diagnostic instead of replacing it with an empty-block error.
  for (const child of block.children) {
    if (child.props.componentType !== "simulation.pcbchannel") continue
    const pattern = child.props.pattern ?? "prbs7"
    const order = /^prbs(7|15|31)$/.exec(pattern)?.[1]
    const seed = child.props.seed
    if (
      order &&
      seed !== undefined &&
      (!Number.isInteger(seed) || seed < 1 || seed > 2 ** Number(order) - 1)
    )
      throw new Error(
        `Signal "${child.props.name}": ${pattern} seed must be an integer in 1..${2 ** Number(order) - 1}.`,
      )
  }
  const board = block._getBoard()
  const blocks = getSignalIntegrityBlocks(board)
  if (
    blocks.length > 1 &&
    blocks.some((candidate) => !candidate._parsedProps.name)
  )
    throw new Error(
      `This board has ${blocks.length} <simulation.pcbtransientchannelsimulation> blocks; give each a name.`,
    )
  if (
    !board?.pcb_board_id ||
    !db.pcb_stackup.getWhere({ pcb_board_id: board.pcb_board_id })
  )
    throw new Error(
      "<simulation.pcbtransientchannelsimulation> needs a stackup: set fabricatorPreset or define one.",
    )

  const signals = block.children.filter(
    (child): child is PcbChannel =>
      child.componentName === "PcbChannel" && !child.shouldBeRemoved,
  )
  if (
    signals.length !==
      block.children.filter((child) => !child.shouldBeRemoved).length ||
    signals.length === 0
  )
    throw new Error(
      "<simulation.pcbtransientchannelsimulation> must contain <simulation.pcbchannel> elements.",
    )
  const names = signals.map((signal) => signal._parsedProps.name)
  if (new Set(names).size !== names.length)
    throw new Error(
      "Signal names must be unique within a <simulation.pcbtransientchannelsimulation> block.",
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
    if (!model) return undefined
    const info = block.ibisModelInfoByUrl.get(model.ibis_model_asset.url)!
    const component = info.components.get(model.ibis_component_name)
    const port = db.source_port.get(portId)!
    const label = describePort(port)
    if (!component)
      throw new Error(
        `${label}: IBIS component "${model.ibis_component_name}" was not found.`,
      )
    if (component.coupledPackage) {
      const chip = db.source_component.get(port.source_component_id!)!
      throw new Error(
        `.${chip.name}: coupled [Package Model] not implemented yet; scalar fallback is forbidden.`,
      )
    }
    const pin = Object.entries(model.ibis_pin_name_to_source_port_id).find(
      ([, id]) => id === portId,
    )![0]
    const pinModel = component.pinModels.get(pin)
    const choices =
      info.modelSelectors.get(pinModel!) ?? (pinModel ? [pinModel] : [])
    const selected = override ?? model.ibis_pin_name_to_model_name?.[pin]
    const modelName =
      selected ?? (choices.length === 1 ? choices[0] : undefined)
    if (!modelName)
      throw new Error(
        `${label}: choose an IBIS model from ${choices.join(", ")}.`,
      )
    if (!choices.includes(modelName) || !info.modelTypes.has(modelName))
      throw new Error(`${label}: selected model is not valid for this pin.`)
    return {
      model,
      component,
      pin,
      modelName,
      modelType: info.modelTypes.get(modelName)!,
    }
  }
  const resolveEndpoint = (
    signal: PcbChannel,
    endpoint: SignalEndpointProps,
    role: "driver" | "receiver",
    restored?: SimulationSignal["driver"],
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
    const ports = restored
      ? "source_port_id" in restored
        ? [restored.source_port_id]
        : [restored.p_source_port_id, restored.n_source_port_id]
      : selectors.map(
          (selector) =>
            resolveExternalSimulationPort({ declaration: block, selector })
              .source_port_id!,
        )
    const overrides = restored
      ? "source_port_id" in restored
        ? [restored.ibis_model_name]
        : [restored.p_ibis_model_name, restored.n_ibis_model_name]
      : typeof override === "object"
        ? [override.p, override.n]
        : selectors.map(() => override)
    const metadata = ports.map((portId, leg) => {
      const info = getPortModelInfo(portId, overrides[leg])
      if (!info)
        throw new Error(
          `Signal "${signal._parsedProps.name}" ${role} ${selectors[leg]} has no <simulation.ibismodel>.`,
        )
      const receives = [
        "input",
        "i/o",
        "i/o_open_drain",
        "i/o_open_sink",
        "i/o_open_source",
      ].includes(info.modelType)
      const drives = [
        "output",
        "3-state",
        "i/o",
        "open_drain",
        "open_sink",
        "open_source",
        "i/o_open_drain",
        "i/o_open_sink",
        "i/o_open_source",
      ].includes(info.modelType)
      if (role === "receiver" ? !receives : !drives)
        throw new Error(
          `${selectors[leg]}: selected model does not support ${role === "receiver" ? "receiving" : "driving"} on this pin.`,
        )
      if (
        role === "driver" &&
        signal._parsedProps.driverDisabled &&
        ![
          "3-state",
          "i/o",
          "i/o_open_drain",
          "i/o_open_sink",
          "i/o_open_source",
        ].includes(info.modelType)
      )
        throw new Error(
          `Signal "${signal._parsedProps.name}": ${selectors[leg]} model ${info.modelName} has no disabled state.`,
        )
      return info
    })
    if (ports.length === 2) {
      if (ports[0] === ports[1])
        throw new Error(
          `Signal "${signal._parsedProps.name}" needs two different differential pins.`,
        )
      const [positive, negative] = metadata
      if (
        [...positive.component.differentialPins.values()].includes(positive.pin)
      )
        throw new Error(
          `Signal "${signal._parsedProps.name}": ${selectors[0]} is the inverting pin; swap p and n.`,
        )
      if (
        positive.model !== negative.model ||
        (positive.component.differentialPins.size &&
          positive.component.differentialPins.get(positive.pin) !==
            negative.pin)
      )
        throw new Error(
          `Signal "${signal._parsedProps.name}" endpoints must match an IBIS [Diff_pin] pair on one chip.`,
        )
    }
    const record: SimulationSignal["driver"] =
      ports.length === 1
        ? {
            source_port_id: ports[0],
            ...(overrides[0] ? { ibis_model_name: overrides[0] } : {}),
          }
        : {
            p_source_port_id: ports[0],
            n_source_port_id: ports[1],
            ...(overrides[0] ? { p_ibis_model_name: overrides[0] } : {}),
            ...(overrides[1] ? { n_ibis_model_name: overrides[1] } : {}),
          }
    return { ports, selectors, record }
  }
  const resolved = signals.map((signal) => {
    const signalProps = signal._parsedProps
    const seed = getSignalSeed(block, signal)
    const driver = resolveEndpoint(
      signal,
      signalProps.driverRef,
      "driver",
      signal.restoredEndpoints?.driver,
    )
    const receivers = (
      Array.isArray(signalProps.receiverRef)
        ? signalProps.receiverRef
        : [signalProps.receiverRef]
    ).map((receiver, i) =>
      resolveEndpoint(
        signal,
        receiver,
        "receiver",
        signal.restoredEndpoints?.receivers[i],
      ),
    )
    if (
      receivers.some(
        (receiver) => receiver.ports.length !== driver.ports.length,
      )
    )
      throw new Error(
        `Signal "${signalProps.name}" driver and receivers must use the same endpoint shape.`,
      )
    const ports = topology.ports.filter((port) =>
      driver.ports.some((driverId) =>
        topology.connected(driverId, port.source_port_id),
      ),
    )
    return { signal, driver, receivers, ports, seed }
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
      if (info?.modelType === "output")
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
          !props.allowUnroutedTraces &&
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
    if (!props.allowUnroutedTraces) {
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
  if (block.simulation_signal_integrity_id)
    db.simulation_signal_integrity.update(
      block.simulation_signal_integrity_id,
      { ...blockRecord, name: props.name, duration_s: durationS },
    )
  else
    block.simulation_signal_integrity_id =
      db.simulation_signal_integrity.insert(
        blockRecord,
      ).simulation_signal_integrity_id
  if (durationS === undefined)
    delete db.simulation_signal_integrity.get(
      block.simulation_signal_integrity_id,
    )!.duration_s
  if (props.name === undefined)
    delete db.simulation_signal_integrity.get(
      block.simulation_signal_integrity_id,
    )!.name
  for (const { signal, driver, receivers, seed } of resolved) {
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
      db.simulation_signal.update(signal.simulation_signal_id, {
        ...record,
        seed,
        driver_disabled: signalProps.driverDisabled || undefined,
      })
    else
      signal.simulation_signal_id =
        db.simulation_signal.insert(record).simulation_signal_id
    const stored = db.simulation_signal.get(signal.simulation_signal_id!)!
    if (seed === undefined) delete stored.seed
    if (!signalProps.driverDisabled) delete stored.driver_disabled
  }
}
