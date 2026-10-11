import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceTrace } from "circuit-json"
import type { Capacitor } from "../../../normal-components/Capacitor"
import type { NormalComponent } from "../../../base-components/NormalComponent"
import { Port } from "../../Port"
import { portShouldHaveDecouplingCapacitor } from "../../Port/Port_isConnectedToPower"
import { portIsGround } from "../../Port/Port_isConnectedToGround"
import { resolvePortSourcePinAttributes } from "../../Port/resolve-port-source-pin-attributes"

/** Resolve only local capacitor-to-chip endpoints, without changing connectivity. */
export const getDecouplingLengthConstraintFromConnectedComponents = (
  ports: Port[],
  { db }: { db: CircuitJsonUtilObjects },
):
  | {
      maxLength: number
      constraint: NonNullable<SourceTrace["max_length_constraint"]>
    }
  | undefined => {
  if (ports.length === 0 || ports.length > 2) return undefined
  for (const capacitorPort of ports) {
    const capacitor = capacitorPort.getParentNormalComponent() as
      | Capacitor
      | undefined
    if (capacitor?.config.componentName !== "Capacitor") continue
    const sourceComponent = db.source_component.get(
      capacitor.source_component_id!,
    )
    if (sourceComponent?.ftype !== "simple_capacitor") continue
    const maxLength = sourceComponent.max_decoupling_trace_length
    if (typeof maxLength !== "number") continue

    const selectTarget = (selector: string | undefined): Port | undefined => {
      if (!selector) return undefined
      const matches = capacitor
        .getSubcircuit()
        .selectAll(selector)
        .filter((port) => port instanceof Port)
      return matches.length === 1 && matches[0] instanceof Port
        ? matches[0]
        : undefined
    }
    const localChipPort = ports.find((port) => port !== capacitorPort)
    let target: Port | undefined
    if (localChipPort) {
      const attributes = resolvePortSourcePinAttributes(localChipPort)
      const explicitTarget = [
        capacitor.props.decouplingFor,
        capacitor.props.decouplingTo,
      ].some((selector) => selectTarget(selector) === localChipPort)
      if (
        (capacitor.props.decouplingFor || capacitor.props.decouplingTo) &&
        !explicitTarget
      )
        continue
      if (
        localChipPort.getParentNormalComponent()?.config.componentName !==
          "Chip" ||
        (!explicitTarget &&
          attributes.should_have_decoupling_capacitor === false)
      )
        continue
      if (
        explicitTarget ||
        portIsGround(localChipPort) ||
        portShouldHaveDecouplingCapacitor(localChipPort)
      )
        target = localChipPort
    } else {
      if (
        !capacitorPort.isConnectedToGround() ||
        capacitorPort.isConnectedToPower()
      )
        continue
      // A net name does not identify the local return target. Prefer the
      // existing explicit decouplingTo selector; otherwise require one chip
      // on the opposite capacitor terminal with exactly one ground pin.
      const { decouplingFor, decouplingTo } = (capacitor as Capacitor).props
      if (decouplingTo) {
        const selected = selectTarget(decouplingTo)
        if (
          selected?.getParentNormalComponent()?.config.componentName === "Chip"
        )
          target = selected
        else continue
      }
      if (!target) {
        const oppositePorts = capacitor.children.filter(
          (child): child is Port =>
            child instanceof Port && child !== capacitorPort,
        )
        const supplyPorts = oppositePorts
          .flatMap((port) =>
            port
              ._getDirectlyConnectedTraces()
              .flatMap((trace) => trace._findConnectedPorts().ports),
          )
          .filter(
            (port): port is Port =>
              port !== undefined &&
              port !== capacitorPort &&
              portShouldHaveDecouplingCapacitor(port) &&
              !portIsGround(port),
          )
        const explicitSupply = selectTarget(decouplingFor)
        if (decouplingFor && !explicitSupply) continue
        if (explicitSupply instanceof Port) supplyPorts.push(explicitSupply)
        const chips = new Set(
          supplyPorts.map(
            (port) =>
              port.getParentNormalComponent() as NormalComponent | undefined,
          ),
        )
        if (chips.size !== 1) continue
        const chip = [...chips][0]!
        if (!chip) continue
        const returnNets = capacitorPort
          ._getDirectlyConnectedTraces()
          .flatMap((trace) => trace._findConnectedNets().nets)
        const grounds = chip.children.filter(
          (child): child is Port =>
            child instanceof Port &&
            portIsGround(child) &&
            child
              ._getDirectlyConnectedTraces()
              .some((trace) =>
                trace
                  ._findConnectedNets()
                  .nets.some((net) => returnNets.includes(net)),
              ),
        )
        if (grounds.length === 1) target = grounds[0]
      }
    }
    if (!target?.source_port_id || !capacitorPort.source_port_id) continue
    return {
      maxLength,
      constraint: {
        origin: "decoupling",
        source_port_ids: [capacitorPort.source_port_id, target.source_port_id],
      },
    }
  }
  return undefined
}

export const getMaxLengthFromConnectedComponents = (
  ports: Port[],
  { db }: { db: CircuitJsonUtilObjects },
): number | undefined => {
  return getDecouplingLengthConstraintFromConnectedComponents(ports, { db })
    ?.maxLength
}
