import type { PinAttributeMap } from "@tscircuit/props"
import type { Net } from "lib/components/primitive-components/Net"
import { Port } from "lib/components/primitive-components/Port"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { TraceConnectionError } from "lib/errors"
import {
  GROUND_NET_REGEX,
  POWER_NET_REGEX,
} from "lib/utils/gnd-power-net-regex"
import type { Capacitor } from "./Capacitor"

interface ResolvedTraceConnections {
  connectedPorts: Port[]
  connectedNets: Net[]
}

interface CapacitorSideCharacteristics {
  hasChipPowerPort: boolean
  hasGround: boolean
}

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

function getCapacitorPorts(capacitor: Capacitor): Port[] {
  const capacitorPorts: Port[] = []
  for (const capacitorChild of capacitor.children) {
    if (capacitorChild instanceof Port) capacitorPorts.push(capacitorChild)
  }
  return capacitorPorts
}

function getResolvedSubcircuitTraceConnections(
  capacitor: Capacitor,
): ResolvedTraceConnections[] {
  const resolvedTraceConnections: ResolvedTraceConnections[] = []
  const subcircuitTraces = capacitor
    .getSubcircuit()
    .selectAll("trace") as Trace[]

  for (const subcircuitTrace of subcircuitTraces) {
    let connectedPorts: Port[]
    try {
      connectedPorts = subcircuitTrace._findConnectedPorts().ports ?? []
    } catch (error) {
      if (error instanceof TraceConnectionError) continue
      throw error
    }

    const connectedNets: Net[] = []
    for (const connectedNet of subcircuitTrace._findConnectedNets().nets) {
      if (connectedNet) connectedNets.push(connectedNet)
    }
    resolvedTraceConnections.push({ connectedPorts, connectedNets })
  }

  return resolvedTraceConnections
}

function chipPortShouldHaveDecouplingCapacitor(sourcePort: Port): boolean {
  const sourceComponent = sourcePort.getParentNormalComponent()
  if (sourceComponent?.config.componentName !== "Chip") return false

  const pinAttributes = sourceComponent._parsedProps.pinAttributes as
    | Record<string, PinAttributeMap>
    | undefined
  let shouldHaveDecouplingCapacitor: boolean | undefined
  let requiresPower: boolean | undefined
  let providesPower: boolean | undefined

  for (const portName of sourcePort.getNameAndAliases()) {
    const portAttributes = pinAttributes?.[portName]
    if (!portAttributes) continue
    if (portAttributes.shouldHaveDecouplingCapacitor !== undefined) {
      shouldHaveDecouplingCapacitor =
        portAttributes.shouldHaveDecouplingCapacitor
    }
    if (portAttributes.requiresPower !== undefined) {
      requiresPower = portAttributes.requiresPower
    }
    if (portAttributes.providesPower !== undefined) {
      providesPower = portAttributes.providesPower
    }
  }

  if (shouldHaveDecouplingCapacitor !== undefined) {
    return shouldHaveDecouplingCapacitor
  }
  if (requiresPower !== undefined) return requiresPower
  if (providesPower === true) return false

  for (const portName of sourcePort.getNameAndAliases()) {
    if (POWER_NET_REGEX.test(portName)) return true
  }
  return false
}

function portIsGround(sourcePort: Port): boolean {
  const sourceComponent = sourcePort.getParentNormalComponent()
  const pinAttributes = sourceComponent?._parsedProps.pinAttributes as
    | Record<string, PinAttributeMap>
    | undefined
  let requiresGround: boolean | undefined
  let providesGround: boolean | undefined

  for (const portName of sourcePort.getNameAndAliases()) {
    const portAttributes = pinAttributes?.[portName]
    if (!portAttributes) continue
    if (portAttributes.requiresGround !== undefined) {
      requiresGround = portAttributes.requiresGround
    }
    if (portAttributes.providesGround !== undefined) {
      providesGround = portAttributes.providesGround
    }
  }

  if (requiresGround === true || providesGround === true) return true
  for (const portName of sourcePort.getNameAndAliases()) {
    if (GROUND_NET_REGEX.test(portName)) return true
  }
  return false
}

function netIsGround(connectedNet: Net): boolean {
  return (
    connectedNet._parsedProps.isGroundNet ??
    GROUND_NET_REGEX.test(connectedNet._parsedProps.name)
  )
}

function includePortCharacteristics(
  sideCharacteristics: CapacitorSideCharacteristics,
  connectedPort: Port,
): void {
  sideCharacteristics.hasChipPowerPort ||=
    chipPortShouldHaveDecouplingCapacitor(connectedPort)
  sideCharacteristics.hasGround ||= portIsGround(connectedPort)
}

function includeConnectedNetCharacteristics(
  sideCharacteristics: CapacitorSideCharacteristics,
  connectedNet: Net,
  resolvedTraceConnections: ResolvedTraceConnections[],
): void {
  sideCharacteristics.hasGround ||= netIsGround(connectedNet)

  for (const traceConnections of resolvedTraceConnections) {
    if (!traceConnections.connectedNets.includes(connectedNet)) continue
    for (const connectedPort of traceConnections.connectedPorts) {
      includePortCharacteristics(sideCharacteristics, connectedPort)
    }
  }
}

function getCapacitorSideCharacteristics(
  capacitorPort: Port,
  resolvedTraceConnections: ResolvedTraceConnections[],
): CapacitorSideCharacteristics {
  const sideCharacteristics = {
    hasChipPowerPort: false,
    hasGround: false,
  }
  const connectedNets = new Set<Net>()

  for (const traceConnections of resolvedTraceConnections) {
    if (!traceConnections.connectedPorts.includes(capacitorPort)) continue

    for (const connectedPort of traceConnections.connectedPorts) {
      includePortCharacteristics(sideCharacteristics, connectedPort)
    }
    for (const connectedNet of traceConnections.connectedNets) {
      connectedNets.add(connectedNet)
    }
  }

  for (const connectedNet of connectedNets) {
    includeConnectedNetCharacteristics(
      sideCharacteristics,
      connectedNet,
      resolvedTraceConnections,
    )
  }

  return sideCharacteristics
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

/**
 * Infers a capacitor's default during SourceRender, after trace props have
 * created connectivity instances and before SourceTraceRender propagates it.
 */
export function Capacitor_getAutomaticMaxDecouplingTraceLength(
  capacitor: Capacitor,
): number | undefined {
  const capacitorPorts = getCapacitorPorts(capacitor)
  if (capacitorPorts.length !== 2) return undefined

  const resolvedTraceConnections =
    getResolvedSubcircuitTraceConnections(capacitor)
  const firstSide = getCapacitorSideCharacteristics(
    capacitorPorts[0],
    resolvedTraceConnections,
  )
  const secondSide = getCapacitorSideCharacteristics(
    capacitorPorts[1],
    resolvedTraceConnections,
  )
  const isPowerToGroundTopology =
    sidesFormPowerToGroundTopology(firstSide, secondSide) ||
    sidesFormPowerToGroundTopology(secondSide, firstSide)

  return isPowerToGroundTopology
    ? DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM
    : undefined
}
