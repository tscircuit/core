import { pcbKeepoutProps } from "@tscircuit/props"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { RenderPhaseFn } from "../base-components/Renderable"
import { Keepout_doInitialPcbPrimitiveRender } from "./Keepout_doInitialPcbPrimitiveRender"

export class Keepout extends PrimitiveComponent<typeof pcbKeepoutProps> {
  pcb_keepout_id: string | null = null

  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Keepout",
      zodProps: pcbKeepoutProps,
    }
  }

  getExcludedPcbComponentIds(): PcbComponentId[] {
    const excludedPcbComponentIds =
      this._parsedProps.excludeRefs?.flatMap((selector) =>
        this.getSubcircuit()
          .selectAll(selector)
          .map((component) => component.pcb_component_id)
          .filter((id): id is PcbComponentId => id !== null),
      ) ?? []

    return Array.from(new Set(excludedPcbComponentIds))
  }

  doInitialPcbPrimitiveRender(): void {
    Keepout_doInitialPcbPrimitiveRender(this)
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width, height: props.height }
    }
    const xCoordinates = props.outline.map((point) => point.x)
    const yCoordinates = props.outline.map((point) => point.y)
    return {
      width:
        Math.max(...xCoordinates) -
        Math.min(...xCoordinates) +
        props.strokeWidth,
      height:
        Math.max(...yCoordinates) -
        Math.min(...yCoordinates) +
        props.strokeWidth,
    }
  }
}
