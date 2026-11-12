import type { SignalEndpoint as SignalEndpointProps } from "@tscircuit/props"
import type { SimulationSignal, SourcePort } from "circuit-json"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { PcbChannel } from "lib/components/primitive-components/PcbChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import { getSignalPortModelInfo } from "./get-signal-port-model"

type SourcePortId = SourcePort["source_port_id"]

function resolveEndpointPorts(
  block: PcbTransientChannelSimulation,
  selectors: string[],
  override: string | { p: string; n: string } | undefined,
  restored?: SimulationSignal["driver"],
) {
  if (restored) {
    if ("source_port_id" in restored)
      return {
        ports: [restored.source_port_id],
        overrides: [restored.ibis_model_name],
      }
    return {
      ports: [restored.p_source_port_id, restored.n_source_port_id],
      overrides: [restored.p_ibis_model_name, restored.n_ibis_model_name],
    }
  }
  const ports = selectors.map(
    (selector) =>
      resolveExternalSimulationPort({ declaration: block, selector })
        .source_port_id!,
  )
  const overrides =
    typeof override === "object"
      ? [override.p, override.n]
      : selectors.map(() => override)
  return { ports, overrides }
}

function validateEndpointModels(
  signal: PcbChannel,
  role: "driver" | "receiver",
  selectors: string[],
  ports: SourcePortId[],
  overrides: (string | undefined)[],
  block: PcbTransientChannelSimulation,
) {
  return ports.map((portId, leg) => {
    const info = getSignalPortModelInfo(block, portId, overrides[leg])
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
}

function validateDifferentialPair(
  signal: PcbChannel,
  selectors: string[],
  ports: SourcePortId[],
  metadata: ReturnType<typeof validateEndpointModels>,
) {
  if (ports.length !== 2) return
  if (ports[0] === ports[1])
    throw new Error(
      `Signal "${signal._parsedProps.name}" needs two different differential pins.`,
    )
  const [positive, negative] = metadata
  if ([...positive.component.differentialPins.values()].includes(positive.pin))
    throw new Error(
      `Signal "${signal._parsedProps.name}": ${selectors[0]} is the inverting pin; swap p and n.`,
    )
  if (
    positive.model !== negative.model ||
    (positive.component.differentialPins.size &&
      positive.component.differentialPins.get(positive.pin) !== negative.pin)
  )
    throw new Error(
      `Signal "${signal._parsedProps.name}" endpoints must match an IBIS [Diff_pin] pair on one chip.`,
    )
}

export function resolveSignalEndpoint(
  block: PcbTransientChannelSimulation,
  signal: PcbChannel,
  endpoint: SignalEndpointProps,
  role: "driver" | "receiver",
  restored?: SimulationSignal["driver"],
) {
  const pin =
    typeof endpoint === "object" && "pin" in endpoint ? endpoint.pin : endpoint
  const override =
    typeof endpoint === "object" && "pin" in endpoint
      ? endpoint.model
      : undefined
  const selectors = typeof pin === "string" ? [pin] : [pin.p, pin.n]
  const { ports, overrides } = resolveEndpointPorts(
    block,
    selectors,
    override,
    restored,
  )
  const metadata = validateEndpointModels(
    signal,
    role,
    selectors,
    ports,
    overrides,
    block,
  )
  validateDifferentialPair(signal, selectors, ports, metadata)
  if (ports.length === 1) {
    return {
      ports,
      selectors,
      record: {
        source_port_id: ports[0],
        ...(overrides[0] ? { ibis_model_name: overrides[0] } : {}),
      },
    }
  }
  return {
    ports,
    selectors,
    record: {
      p_source_port_id: ports[0],
      n_source_port_id: ports[1],
      ...(overrides[0] ? { p_ibis_model_name: overrides[0] } : {}),
      ...(overrides[1] ? { n_ibis_model_name: overrides[1] } : {}),
    },
  }
}
