import type { Capacitor } from "lib/components/normal-components/Capacitor"
import type { Group } from "lib/components/primitive-components/Group"
import type { Net } from "lib/components/primitive-components/Net"
import type { Port } from "lib/components/primitive-components/Port"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { TraceConnectionError } from "lib/errors"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import { chipPortShouldHaveDecouplingCapacitor } from "./chip-port-should-have-decoupling-capacitor"
import { portIsGround } from "./port-is-ground"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

/**
 * Detects capacitors bridging chip power-input ports and ground, then records
 * the default maximum trace length before source traces are rendered. The
 * subcircuit connectivity graph is assembled once for all of its capacitors.
 */
export const applyAutomaticDecouplingTraceLengths = (
  group: Group<any>,
): void => {
  if (!group.isSubcircuit) return

  const automaticCandidateCapacitors = (
    group.selectAll("capacitor") as Capacitor[]
  ).filter(
    (capacitor) =>
      capacitor._parsedProps.maxDecouplingTraceLength === undefined,
  )
  if (automaticCandidateCapacitors.length === 0) return

  const connectivityByPort = new Map<
    Port,
    { connectedPorts: Set<Port>; connectedNets: Set<Net> }
  >()
  const portsByNet = new Map<Net, Set<Port>>()

  for (const trace of group.selectAll("trace") as Trace[]) {
    let tracePorts: Port[]
    try {
      tracePorts = trace._findConnectedPorts().ports ?? []
    } catch (error) {
      if (error instanceof TraceConnectionError) continue
      throw error
    }
    const traceNets = trace
      ._findConnectedNets()
      .nets.filter((connectedNet): connectedNet is Net => Boolean(connectedNet))

    for (const tracePort of tracePorts) {
      let portConnectivity = connectivityByPort.get(tracePort)
      if (!portConnectivity) {
        portConnectivity = {
          connectedPorts: new Set<Port>(),
          connectedNets: new Set<Net>(),
        }
        connectivityByPort.set(tracePort, portConnectivity)
      }

      for (const connectedPort of tracePorts) {
        if (connectedPort !== tracePort) {
          portConnectivity.connectedPorts.add(connectedPort)
        }
      }
      for (const connectedNet of traceNets) {
        portConnectivity.connectedNets.add(connectedNet)
        let netPorts = portsByNet.get(connectedNet)
        if (!netPorts) {
          netPorts = new Set<Port>()
          portsByNet.set(connectedNet, netPorts)
        }
        netPorts.add(tracePort)
      }
    }
  }

  const connectionCharacteristicsByNet = new Map<
    Net,
    { hasChipPowerPort: boolean; hasGroundPort: boolean }
  >()
  for (const [connectedNet, netPorts] of portsByNet) {
    connectionCharacteristicsByNet.set(connectedNet, {
      hasChipPowerPort: [...netPorts].some(
        chipPortShouldHaveDecouplingCapacitor,
      ),
      hasGroundPort: [...netPorts].some(portIsGround),
    })
  }

  const { db } = group.root!
  for (const capacitor of automaticCandidateCapacitors) {
    if (!capacitor.source_component_id) continue

    const capacitorPorts = capacitor.children.filter(
      (child): child is Port => child.componentName === "Port",
    )
    if (capacitorPorts.length !== 2) continue

    const connectedSides = capacitorPorts.map((capacitorPort) => {
      const portConnectivity = connectivityByPort.get(capacitorPort)
      if (!portConnectivity) {
        return { hasChipPowerPort: false, hasGround: false }
      }

      return {
        hasChipPowerPort:
          [...portConnectivity.connectedPorts].some(
            chipPortShouldHaveDecouplingCapacitor,
          ) ||
          [...portConnectivity.connectedNets].some(
            (connectedNet) =>
              connectionCharacteristicsByNet.get(connectedNet)
                ?.hasChipPowerPort === true,
          ),
        hasGround:
          [...portConnectivity.connectedPorts].some(portIsGround) ||
          [...portConnectivity.connectedNets].some(
            (connectedNet) =>
              (connectedNet._parsedProps.isGroundNet ??
                GROUND_NET_REGEX.test(connectedNet._parsedProps.name)) ||
              connectionCharacteristicsByNet.get(connectedNet)
                ?.hasGroundPort === true,
          ),
      }
    })

    const [firstSide, secondSide] = connectedSides
    const hasPowerToGroundTopology =
      (firstSide.hasChipPowerPort &&
        !firstSide.hasGround &&
        secondSide.hasGround &&
        !secondSide.hasChipPowerPort) ||
      (secondSide.hasChipPowerPort &&
        !secondSide.hasGround &&
        firstSide.hasGround &&
        !firstSide.hasChipPowerPort)
    if (!hasPowerToGroundTopology) continue

    db.source_component.update(capacitor.source_component_id, {
      max_decoupling_trace_length: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
    })
  }
}
