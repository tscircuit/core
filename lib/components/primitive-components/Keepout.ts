import { pcbKeepoutProps } from "@tscircuit/props"
import type { PCBKeepout } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { RenderPhaseFn } from "../base-components/Renderable"

type PCBKeepoutExclusionProps = {
  excluded_pcb_component_ids?: PcbComponentId[]
}

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
    if (this.root?.pcbDisabled) return
    const subcircuit = this.getSubcircuit()
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const decomposedMat = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const isRotated90 =
      Math.abs(decomposedMat.rotation.angle * (180 / Math.PI) - 90) % 180 < 0.01
    let layers = props.layers
    if (!layers && props.layer) {
      layers = [props.layer]
    }
    if (!layers) {
      layers = ["top"]
    }
    const excludedPcbComponentIds = this.getExcludedPcbComponentIds()
    const pcbKeepoutExclusionProps: PCBKeepoutExclusionProps =
      excludedPcbComponentIds.length > 0
        ? { excluded_pcb_component_ids: excludedPcbComponentIds }
        : {}

    let pcb_keepout: PCBKeepout | null = null
    if (props.shape === "circle") {
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "circle",
        ...pcbKeepoutExclusionProps,
        // @ts-ignore: no idea why this is triggering
        radius: props.radius,
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    } else if (props.shape === "rect") {
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "rect",
        ...pcbKeepoutExclusionProps,
        ...(isRotated90
          ? { width: props.height, height: props.width }
          : { width: props.width, height: props.height }),
        // @ts-ignore: no idea why this is triggering
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
      })
    }
    if (pcb_keepout) {
      this.pcb_keepout_id = pcb_keepout.pcb_keepout_id
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width, height: props.height }
    }
    return { width: 0, height: 0 }
  }
}
