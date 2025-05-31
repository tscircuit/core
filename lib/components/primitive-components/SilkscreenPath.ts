import { silkscreenPathProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"

export class SilkscreenPath extends PrimitiveComponent<
  typeof silkscreenPathProps
> {
  pcb_silkscreen_path_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenPath",
      zodProps: silkscreenPathProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.getInheritedProperty("pcbDisabled")) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenPath. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()
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
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_silkscreen_path_id = pcb_silkscreen_path.pcb_silkscreen_path_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (!props.route || props.route.length === 0) {
      return { width: 0, height: 0 }
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity

    for (const point of props.route) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
