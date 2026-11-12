import {
  getSignalPortModelInfo,
  describeSignalPort,
} from "lib/utils/simulation/get-signal-port-model"
import { resolveSignalEndpoint } from "lib/utils/simulation/resolve-signal-endpoint"
import { writeSignalIntegrityRecords } from "lib/utils/simulation/write-signal-integrity-records"
import { getSignalIntegrityBlocks } from "lib/utils/simulation/get-signal-integrity-blocks"
import { getSignalTopology } from "lib/utils/simulation/get-signal-topology"
import { getSignalSeed } from "lib/utils/simulation/get-signal-seed"
import { PcbChannel } from "./PcbChannel"
import type { PcbTransientChannelSimulation } from "./PcbTransientChannelSimulation"

function getBlockSignals(block: PcbTransientChannelSimulation) {
  const { db } = block.root!
  // The reconciler stores props errors on placeholders instead of throwing.
  for (const child of block.children) {
    if (
      !child.shouldBeRemoved &&
      child.props.componentType === "simulation.pcbchannel" &&
      child.componentName === "ErrorPlaceholder"
    )
      throw child._parsedProps.error
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
      child instanceof PcbChannel && !child.shouldBeRemoved,
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
  return signals
}

function resolveSignals(
  block: PcbTransientChannelSimulation,
  signals: PcbChannel[],
  topology: ReturnType<typeof getSignalTopology>,
) {
  return signals.map((signal) => {
    const signalProps = signal._parsedProps
    const seed = getSignalSeed(block, signal)
    const driver = resolveSignalEndpoint(
      block,
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
      resolveSignalEndpoint(
        block,
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
}

function validateSignals(
  block: PcbTransientChannelSimulation,
  resolved: ReturnType<typeof resolveSignals>,
  topology: ReturnType<typeof getSignalTopology>,
) {
  const { db } = block.root!
  const props = block._parsedProps
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
      const info = getSignalPortModelInfo(block, port.source_port_id)
      if (info?.modelType === "output")
        throw new Error(
          `Signal "${name}" has two drivers: ${driver.selectors[0]} and ${describeSignalPort(block, port)}. Exactly one pin drives a signal.`,
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
          `Signal "${name}" is not routed between ${driver.selectors[0]} and ${describeSignalPort(block, unroutedPort)}.`,
        )
    }
    for (const port of ports) {
      if (!port.source_component_id) continue
      const component = db.source_component.get(port.source_component_id)!
      if (
        db.simulation_ibis_model
          .list()
          .some(
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
}

/** All IBIS declarations and PCB routes have finished before this phase. */
export function PcbTransientChannelSimulation_doInitialPcbSimulationRender(
  block: PcbTransientChannelSimulation,
): void {
  const signals = getBlockSignals(block)
  const topology = getSignalTopology(block)
  const resolved = resolveSignals(block, signals, topology)
  validateSignals(block, resolved, topology)
  writeSignalIntegrityRecords(block, resolved)
}
