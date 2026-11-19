import type { SignalEndpoint as SignalEndpointProps } from "@tscircuit/props"
import type { SourcePort } from "circuit-json"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { PcbDriverReceiverChannel } from "lib/components/primitive-components/PcbDriverReceiverChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

type SourcePortId = SourcePort["source_port_id"]

function getEndpointSelectors(endpoint: SignalEndpointProps): string[] {
  if (typeof endpoint === "string") return [endpoint]
  if ("pin" in endpoint) return getEndpointSelectors(endpoint.pin)
  return [endpoint.p, endpoint.n]
}

function getEndpointModelNames(endpoint: SignalEndpointProps) {
  if (typeof endpoint === "string" || !("pin" in endpoint)) return []
  const { model } = endpoint
  if (typeof model === "object") return [model.p, model.n]
  return [model, model]
}

function validateEndpoints(args: {
  signal: PcbDriverReceiverChannel
  role: "driver" | "receiver"
  selectors: string[]
  ports: SourcePortId[]
  block: PcbTransientChannelSimulation
}) {
  const { signal, role, selectors, ports, block } = args
  const models = block.root!.db.simulation_ibis_model.list()
  for (const [leg, portId] of ports.entries()) {
    if (
      models.some((model) =>
        Object.values(model.ibis_pin_name_to_source_port_id).includes(portId),
      )
    )
      continue
    throw new Error(
      `Signal "${signal._parsedProps.name}" ${role} ${selectors[leg]} has no <simulation.ibismodel>.`,
    )
  }
  if (ports.length === 2 && ports[0] === ports[1])
    throw new Error(
      `Signal "${signal._parsedProps.name}" needs two different differential pins.`,
    )
}

export function resolveSignalEndpoint(args: {
  block: PcbTransientChannelSimulation
  signal: PcbDriverReceiverChannel
  endpoint: SignalEndpointProps
  role: "driver" | "receiver"
}) {
  const { block, signal, endpoint, role } = args
  const selectors = getEndpointSelectors(endpoint)
  const ports = selectors.map(
    (selector) =>
      resolveExternalSimulationPort({ declaration: block, selector })
        .source_port_id!,
  )
  const [firstModelName, secondModelName] = getEndpointModelNames(endpoint)
  validateEndpoints({ signal, role, selectors, ports, block })
  if (ports.length === 1) {
    return {
      ports,
      selectors,
      record: {
        source_port_id: ports[0],
        ibis_model_name: firstModelName,
      },
    }
  }
  return {
    ports,
    selectors,
    record: {
      p_source_port_id: ports[0],
      n_source_port_id: ports[1],
      p_ibis_model_name: firstModelName,
      n_ibis_model_name: secondModelName,
    },
  }
}
