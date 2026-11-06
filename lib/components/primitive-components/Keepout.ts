import { pcbKeepoutProps } from "@tscircuit/props"
import type { PCBKeepout } from "circuit-json"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

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
    const pcbComponentId =
      this.getPrimitiveContainer()?.pcb_component_id ?? undefined
    const pcbKeepoutOwnershipProps = pcbComponentId
      ? { pcb_component_id: pcbComponentId }
      : {}
    const pcbGroupId = this.getGroup()?.pcb_group_id ?? undefined
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
    const pcbKeepoutExclusionProps =
      excludedPcbComponentIds.length > 0
        ? { excluded_pcb_component_ids: excludedPcbComponentIds }
        : {}

    let pcb_keepout: PCBKeepout | null = null
    if (props.shape === "circle") {
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "circle",
        ...pcbKeepoutOwnershipProps,
        ...pcbKeepoutExclusionProps,
        ...(props.allowTraces !== undefined
          ? { allow_traces: props.allowTraces }
          : {}),
        ...(props.allowPlacements !== undefined
          ? { allow_placements: props.allowPlacements }
          : {}),
        ...(props.warningOnly !== undefined
          ? { warning_only: props.warningOnly }
          : {}),
        // @ts-ignore: no idea why this is triggering
        radius: props.radius,
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: pcbGroupId,
      })
    } else if (props.shape === "rect") {
      pcb_keepout = db.pcb_keepout.insert({
        layers,
        shape: "rect",
        ...pcbKeepoutOwnershipProps,
        ...pcbKeepoutExclusionProps,
        ...(props.allowTraces !== undefined
          ? { allow_traces: props.allowTraces }
          : {}),
        ...(props.allowPlacements !== undefined
          ? { allow_placements: props.allowPlacements }
          : {}),
        ...(props.warningOnly !== undefined
          ? { warning_only: props.warningOnly }
          : {}),
        ...(isRotated90
          ? { width: props.height, height: props.width }
          : { width: props.width, height: props.height }),
        // @ts-ignore: no idea why this is triggering
        center: {
          x: position.x,
          y: position.y,
        },
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: pcbGroupId,
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

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    if (!this.pcb_keepout_id) return super._getPcbCircuitJsonBounds()
    const { db } = this.root!
    const keepout = db.pcb_keepout.get(this.pcb_keepout_id)
    if (!keepout) return super._getPcbCircuitJsonBounds()

    if (keepout.shape === "rect") {
      return {
        center: keepout.center,
        bounds: {
          left: keepout.center.x - keepout.width / 2,
          top: keepout.center.y + keepout.height / 2,
          right: keepout.center.x + keepout.width / 2,
          bottom: keepout.center.y - keepout.height / 2,
        },
        width: keepout.width,
        height: keepout.height,
      }
    }

    if (keepout.shape === "circle") {
      return {
        center: keepout.center,
        bounds: {
          left: keepout.center.x - keepout.radius,
          top: keepout.center.y + keepout.radius,
          right: keepout.center.x + keepout.radius,
          bottom: keepout.center.y - keepout.radius,
        },
        width: keepout.radius * 2,
        height: keepout.radius * 2,
      }
    }

    return super._getPcbCircuitJsonBounds()
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }): void {
    if (!this.pcb_keepout_id) return
    const { db } = this.root!
    const keepout = db.pcb_keepout.get(this.pcb_keepout_id)
    if (!keepout) return

    if (keepout.shape === "rect" || keepout.shape === "circle") {
      db.pcb_keepout.update(this.pcb_keepout_id, {
        ...keepout,
        center: newCenter,
      } as any)
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_keepout_id) return
    const { db } = this.root!
    const keepout = db.pcb_keepout.get(this.pcb_keepout_id)
    if (!keepout) return

    if (keepout.shape === "rect" || keepout.shape === "circle") {
      db.pcb_keepout.update(this.pcb_keepout_id, {
        center: {
          x: keepout.center.x + deltaX,
          y: keepout.center.y + deltaY,
        },
      } as any)
    }
  }
}
