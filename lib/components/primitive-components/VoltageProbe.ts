import { commonComponentProps, voltageProbeProps } from "@tscircuit/props"
import type { SchematicVoltageProbe } from "circuit-json"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Net } from "./Net"
import type { Port } from "./Port"

export class VoltageProbe extends PrimitiveComponent<typeof voltageProbeProps> {
  simulation_voltage_probe_id: string | null = null
  schematic_voltage_probe_id: string | null = null
  finalProbeName: string | null = null

  get config() {
    return {
      componentName: "VoltageProbe",
      zodProps: voltageProbeProps,
    }
  }

  doInitialSimulationRender() {
    const { db } = this.root!
    const { connectsTo, name } = this._parsedProps

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

    const { simulation_voltage_probe_id } = db.simulation_voltage_probe.insert({
      name: this.name, // Use default name as placeholder
      source_port_id: port?.source_port_id ?? undefined,
      source_net_id: net?.source_net_id ?? undefined,
      subcircuit_id: subcircuit.subcircuit_id || undefined,
    })

    this.simulation_voltage_probe_id = simulation_voltage_probe_id

    let finalName = name

    if (!finalName) {
      const probeIndex = parseInt(
        simulation_voltage_probe_id.split("_").pop()!,
        10,
      )
      finalName = `N${probeIndex + 1}`
    }

    db.simulation_voltage_probe.update(simulation_voltage_probe_id, {
      name: finalName,
    })

    this.finalProbeName = finalName
  }

  doInitialSchematicVoltageProbeRender() {
    if (this.root?.schematicDisabled) return
    this._queueAsyncEffect("SchematicVoltageProbeRender", async () => {
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

      let target_trace_id: string | null = null
      for (const trace of db.schematic_trace.list()) {
        for (const edge of trace.edges) {
          if (
            (Math.abs(edge.from.x - position.x) < 1e-6 &&
              Math.abs(edge.from.y - position.y) < 1e-6) ||
            (Math.abs(edge.to.x - position.x) < 1e-6 &&
              Math.abs(edge.to.y - position.y) < 1e-6)
          ) {
            target_trace_id = trace.schematic_trace_id
            break
          }
        }
        if (target_trace_id) break
      }

      if (!target_trace_id) {
        return
      }

      const probeName = this.finalProbeName!

      const schematic_voltage_probe = db.schematic_voltage_probe.insert({
        name: probeName,
        position,
        schematic_trace_id: target_trace_id,
        subcircuit_id: subcircuit.subcircuit_id || undefined,
      } as Omit<SchematicVoltageProbe, "type" | "schematic_voltage_probe_id">)

      this.schematic_voltage_probe_id =
        schematic_voltage_probe.schematic_voltage_probe_id
    })
  }
}
