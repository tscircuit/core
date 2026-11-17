import type { SignalEndpoint as SignalEndpointProps } from "@tscircuit/props"
import type { SourcePort } from "circuit-json"
import { resolveExternalSimulationPort } from "lib/utils/simulation/resolveExternalSimulation"
import type { PcbDriverReceiverChannel } from "lib/components/primitive-components/PcbDriverReceiverChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

type SourcePortId = SourcePort["source_port_id"]

function resolveEndpointPorts(
  block: PcbTransientChannelSimulation,
  selectors: string[],
  override: string | { p: string; n: string } | undefined,
) {
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

function validateEndpoints(
  signal: PcbDriverReceiverChannel,
  role: "driver" | "receiver",
  selectors: string[],
  ports: SourcePortId[],
  block: PcbTransientChannelSimulation,
) {
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

export function resolveSignalEndpoint(
  block: PcbTransientChannelSimulation,
  signal: PcbDriverReceiverChannel,
  endpoint: SignalEndpointProps,
  role: "driver" | "receiver",
) {
  const pin =
    typeof endpoint === "object" && "pin" in endpoint ? endpoint.pin : endpoint
  const override =
    typeof endpoint === "object" && "pin" in endpoint
      ? endpoint.model
      : undefined
  const selectors = typeof pin === "string" ? [pin] : [pin.p, pin.n]
  const { ports, overrides } = resolveEndpointPorts(block, selectors, override)
  validateEndpoints(signal, role, selectors, ports, block)
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
