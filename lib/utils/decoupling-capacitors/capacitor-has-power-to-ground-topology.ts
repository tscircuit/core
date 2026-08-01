import type { Capacitor } from "lib/components/normal-components/Capacitor"
import type { Net } from "lib/components/primitive-components/Net"
import type { Port } from "lib/components/primitive-components/Port"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"
import type {
  DecouplingNetCharacteristics,
  DecouplingSubcircuitConnectivity,
} from "./build-decoupling-subcircuit-connectivity"
import { getDecouplingConnectionCharacteristicsForPorts } from "./build-decoupling-subcircuit-connectivity"

interface CapacitorSideCharacteristics {
  hasChipPowerPort: boolean
  hasGround: boolean
}

function getCapacitorPorts(capacitor: Capacitor): Port[] {
  const capacitorPorts: Port[] = []
  for (const capacitorChild of capacitor.children) {
    if (capacitorChild.componentName === "Port") {
      capacitorPorts.push(capacitorChild as Port)
    }
  }
  return capacitorPorts
}

function netIsGround(
  connectedNet: Net,
  netCharacteristics: DecouplingNetCharacteristics | undefined,
): boolean {
  return (
    (connectedNet._parsedProps.isGroundNet ??
      GROUND_NET_REGEX.test(connectedNet._parsedProps.name)) ||
    netCharacteristics?.hasGroundPort === true
  )
}

function getCapacitorSideCharacteristics(
  capacitorPort: Port,
  subcircuitConnectivity: DecouplingSubcircuitConnectivity,
): CapacitorSideCharacteristics {
  const portConnectivity =
    subcircuitConnectivity.portConnectivityByPort.get(capacitorPort)
  if (!portConnectivity) {
    return { hasChipPowerPort: false, hasGround: false }
  }

  const connectedPortCharacteristics =
    getDecouplingConnectionCharacteristicsForPorts(
      portConnectivity.connectedPorts,
    )
  let hasChipPowerPort = connectedPortCharacteristics.hasChipPowerPort
  let hasGround = connectedPortCharacteristics.hasGroundPort

  for (const connectedNet of portConnectivity.connectedNets) {
    const netCharacteristics =
      subcircuitConnectivity.netCharacteristicsByNet.get(connectedNet)
    hasChipPowerPort ||= netCharacteristics?.hasChipPowerPort === true
    hasGround ||= netIsGround(connectedNet, netCharacteristics)
    if (hasChipPowerPort && hasGround) break
  }

  return { hasChipPowerPort, hasGround }
}

function sidesFormPowerToGroundTopology(
  powerSide: CapacitorSideCharacteristics,
  groundSide: CapacitorSideCharacteristics,
): boolean {
  return (
    powerSide.hasChipPowerPort &&
    !powerSide.hasGround &&
    groundSide.hasGround &&
    !groundSide.hasChipPowerPort
  )
}

/** Returns true when the cap has one chip power side and one ground side. */
export function capacitorHasPowerToGroundTopology(
  capacitor: Capacitor,
  subcircuitConnectivity: DecouplingSubcircuitConnectivity,
): boolean {
  const capacitorPorts = getCapacitorPorts(capacitor)
  if (capacitorPorts.length !== 2) return false

  const firstSide = getCapacitorSideCharacteristics(
    capacitorPorts[0],
    subcircuitConnectivity,
  )
  const secondSide = getCapacitorSideCharacteristics(
    capacitorPorts[1],
    subcircuitConnectivity,
  )

  return (
    sidesFormPowerToGroundTopology(firstSide, secondSide) ||
    sidesFormPowerToGroundTopology(secondSide, firstSide)
  )
}
