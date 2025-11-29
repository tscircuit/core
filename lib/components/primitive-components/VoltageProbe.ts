import { commonComponentProps, voltageProbeProps } from "@tscircuit/props"
import type { SchematicVoltageProbe } from "circuit-json"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Net } from "./Net"
import type { Port } from "./Port"
import { getSimulationColorForId } from "lib/utils/simulation/getSimulationColorForId"

export class VoltageProbe extends PrimitiveComponent<typeof voltageProbeProps> {
  simulation_voltage_probe_id: string | null = null
  schematic_voltage_probe_id: string | null = null
  finalProbeName: string | null = null
  color: string | null = null

  get config() {
    return {
      componentName: "VoltageProbe",
      zodProps: voltageProbeProps,
    }
  }

  doInitialSimulationRender() {
    const { db } = this.root!
    const { connectsTo, name, referenceTo, color } = this._parsedProps

    const subcircuit = this.getSubcircuit()
    if (!subcircuit) {
      this.renderError("VoltageProbe must be inside a subcircuit")
      return
    }

    const targets = Array.isArray(connectsTo) ? connectsTo : [connectsTo]
    if (targets.length !== 1) {
      this.renderError("VoltageProbe must connect to exactly one port or net")
      return
    }
    const targetSelector = targets[0]

    const port = subcircuit.selectOne(targetSelector, {
      type: "port",
    }) as Port | null
    const net = !port
      ? (subcircuit.selectOne(targetSelector, { type: "net" }) as Net | null)
      : null

    if (net && net.componentName !== "Net") {
      this.renderError(
        `VoltageProbe connection target "${targetSelector}" resolved to a non-net component "${net.componentName}".`,
      )
      return
    }

    if (!port && !net) {
      this.renderError(
        `VoltageProbe could not find connection target "${targetSelector}"`,
      )
      return
    }

    const connectedId = port?.source_port_id ?? net?.source_net_id
    if (!connectedId) {
      this.renderError(`Could not identify connected source for VoltageProbe`)
      return
    }

    // Handle reference (for differential probes)
    let referencePort: Port | null = null
    let referenceNet: Net | null = null

    if (referenceTo) {
      const referenceTargets = Array.isArray(referenceTo)
        ? referenceTo
        : [referenceTo]
      if (referenceTargets.length !== 1) {
        this.renderError("VoltageProbe must reference exactly one port or net")
        return
      }
      const referenceSelector = referenceTargets[0]

      referencePort = subcircuit.selectOne(referenceSelector, {
        type: "port",
      }) as Port | null
      referenceNet = !referencePort
        ? (subcircuit.selectOne(referenceSelector, {
            type: "net",
          }) as Net | null)
        : null

      if (referenceNet && referenceNet.componentName !== "Net") {
        this.renderError(
          `VoltageProbe reference target "${referenceSelector}" resolved to a non-net component "${referenceNet.componentName}".`,
        )
        return
      }

      if (!referencePort && !referenceNet) {
        this.renderError(
          `VoltageProbe could not find reference target "${referenceSelector}"`,
        )
        return
      }
    }

    this.color = color ?? getSimulationColorForId(connectedId)

    let finalName: string | undefined = name

    if (!finalName) {
      finalName = targets[0]
        .split(" > ")
        .map((s: string) => s.replace(/^\./, ""))
        .join(".")
    }

    this.finalProbeName = finalName ?? null

    const { simulation_voltage_probe_id } = db.simulation_voltage_probe.insert({
      name: finalName,
      signal_input_source_port_id: port?.source_port_id ?? undefined,
      signal_input_source_net_id: net?.source_net_id ?? undefined,
      reference_input_source_port_id:
        referencePort?.source_port_id ?? undefined,
      reference_input_source_net_id: referenceNet?.source_net_id ?? undefined,
      subcircuit_id: subcircuit.subcircuit_id || undefined,
      color: this.color,
    })

    this.simulation_voltage_probe_id = simulation_voltage_probe_id
  }

  doInitialSchematicReplaceNetLabelsWithSymbols() {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { connectsTo, name } = this._parsedProps

    const subcircuit = this.getSubcircuit()
    if (!subcircuit) {
      return
    }

    const targets = Array.isArray(connectsTo) ? connectsTo : [connectsTo]
    if (targets.length !== 1) {
      return
    }
    const targetSelector = targets[0]

    const port = subcircuit.selectOne(targetSelector, {
      type: "port",
    }) as Port | null

    if (!port) return
    if (!port.schematic_port_id) return

    const position = port._getGlobalSchematicPositionAfterLayout()

    let targetTraceId: string | null = null
    for (const trace of db.schematic_trace.list()) {
      for (const edge of trace.edges) {
        if (
          (Math.abs(edge.from.x - position.x) < 1e-6 &&
            Math.abs(edge.from.y - position.y) < 1e-6) ||
          (Math.abs(edge.to.x - position.x) < 1e-6 &&
            Math.abs(edge.to.y - position.y) < 1e-6)
        ) {
          targetTraceId = trace.schematic_trace_id
          break
        }
      }
      if (targetTraceId) break
    }

    if (!targetTraceId) {
      return
    }

    const probeName = this.finalProbeName!
    const schematic_voltage_probe = db.schematic_voltage_probe.insert({
      name: probeName,
      position,
      schematic_trace_id: targetTraceId,
      subcircuit_id: subcircuit.subcircuit_id || undefined,
      color: this.color ?? undefined,
    } as Omit<SchematicVoltageProbe, "type" | "schematic_voltage_probe_id">)

    this.schematic_voltage_probe_id =
      schematic_voltage_probe.schematic_voltage_probe_id
  }
}
