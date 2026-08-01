import { Port } from "lib/components/primitive-components/Port"
import type { Capacitor } from "./Capacitor"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

function getCapacitorPorts(capacitor: Capacitor): Port[] {
  const capacitorPorts: Port[] = []
  for (const capacitorChild of capacitor.children) {
    if (capacitorChild instanceof Port) capacitorPorts.push(capacitorChild)
  }
  return capacitorPorts
}

/**
 * Infers a capacitor's default during SourceRender, after trace props have
 * created connectivity instances and before SourceTraceRender propagates it.
 */
export function Capacitor_getAutomaticMaxDecouplingTraceLength(
  capacitor: Capacitor,
): number | undefined {
  const capacitorPorts = getCapacitorPorts(capacitor)
  if (capacitorPorts.length !== 2) return undefined

  const firstPortIsConnectedToPower = capacitorPorts[0].isConnectedToPower()
  const firstPortIsConnectedToGround = capacitorPorts[0].isConnectedToGround()
  const secondPortIsConnectedToPower = capacitorPorts[1].isConnectedToPower()
  const secondPortIsConnectedToGround = capacitorPorts[1].isConnectedToGround()
  const isPowerToGroundTopology =
    (firstPortIsConnectedToPower &&
      !firstPortIsConnectedToGround &&
      secondPortIsConnectedToGround &&
      !secondPortIsConnectedToPower) ||
    (secondPortIsConnectedToPower &&
      !secondPortIsConnectedToGround &&
      firstPortIsConnectedToGround &&
      !firstPortIsConnectedToPower)

  return isPowerToGroundTopology
    ? DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM
    : undefined
}
