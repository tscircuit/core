import { silkscreenPathProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class SilkscreenPath extends PrimitiveComponent<
  typeof silkscreenPathProps
> {
  pcb_silkscreen_path_id: string | null = null

  get config() {
    return {
      zodProps: silkscreenPathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()

    const pcb_silkscreen_path = db.pcb_silkscreen_path.insert({
      pcb_component_id: this.parent?.pcb_component_id!,
      layer,
      route: props.route.map((p) => {
        const transformedPosition = applyToPoint(transform, {
          x: p.x,
          y: p.y,
        })
        return {
          ...p,
          x: transformedPosition.x,
          y: transformedPosition.y,
        }
      }),
      stroke_width: props.strokeWidth ?? 0.1,
    })

    this.pcb_silkscreen_path_id = pcb_silkscreen_path.pcb_silkscreen_path_id
  }
}
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const silkscreenPathProps = z.object({
  path: z.string(),
  layer: z.enum(["top", "bottom"]).default("top"),
  width: z.string().optional(),
})

export class SilkscreenPath extends PrimitiveComponent<typeof silkscreenPathProps> {
  constructor(props: z.input<typeof silkscreenPathProps>) {
    super(props)
  }

  get config() {
    return {
      zodProps: silkscreenPathProps,
    }
  }

  doInitialSourceComponentRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    db.source_component.create({
      id: this.id,
      type: "silkscreenpath",
      ...props,
    })
  }
}
