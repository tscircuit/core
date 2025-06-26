import { netLabelProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import { Trace } from "./Trace/Trace"
import { Net } from "./Net"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"

export class NetLabel extends PrimitiveComponent<typeof netLabelProps> {
  source_net_label_id?: string

  get config() {
    return {
      componentName: "NetLabel",
      zodProps: netLabelProps,
    }
  }

  doInitialSchematicComponentRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const anchorPos = { x: props.schX ?? 0, y: props.schY ?? 0 }

    const anchorSide = props.anchorSide ?? "right"
    const center = computeSchematicNetLabelCenter({
      anchor_position: anchorPos,
      anchor_side: anchorSide,
      text: props.net!,
    })

    const netLabel = db.schematic_net_label.insert({
      text: props.net!,
      source_net_id: props.net!,
      anchor_position: anchorPos,
      center,
      anchor_side: anchorSide,
    })

    this.source_net_label_id = netLabel.source_net_id
  }

  _resolveConnectsTo(): string[] | undefined {
    const { _parsedProps: props } = this

    const connectsTo = props.connectsTo ?? props.connection

    if (Array.isArray(connectsTo)) {
      return connectsTo
    }

    if (typeof connectsTo === "string") {
      return [connectsTo]
    }

    return undefined
  }

  _getNetName(): string {
    const { _parsedProps: props } = this
    return props.net!
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    if (props.net) {
      createNetsFromProps(this, [`net.${props.net}`])
    }
  }

  doInitialCreateTracesFromNetLabels(): void {
    if (this.root?.schematicDisabled) return
    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return

    // TODO check if connection is already represented by a trace in the
    // subcircuit

    for (const connection of connectsTo) {
      this.add(
        new Trace({
          from: connection,
          to: `net.${this._getNetName()}`,
        }),
      )
    }
  }
}
