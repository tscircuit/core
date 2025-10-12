import { commonComponentProps } from "@tscircuit/props"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Net } from "./Net"
import type { Port } from "./Port"

export const voltageProbeProps = commonComponentProps
  .omit({ name: true })
  .extend({
    name: z.string().optional(),
    connectsTo: z.string().or(z.array(z.string())),
  })

export type VoltageProbeProps = z.input<typeof voltageProbeProps>

export class VoltageProbe extends PrimitiveComponent<typeof voltageProbeProps> {
  simulation_voltage_probe_id: string | null = null

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
      name: name ?? this.name,
      source_port_id: port?.source_port_id ?? undefined,
      source_net_id: net?.source_net_id ?? undefined,
      subcircuit_id: subcircuit.subcircuit_id || undefined,
    })

    this.simulation_voltage_probe_id = simulation_voltage_probe_id
  }
}
