import type { PCBKeepout } from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import type { Keepout } from "./Keepout"

export function Keepout_doInitialPcbPrimitiveRender(keepout: Keepout): void {
  if (keepout.root?.pcbDisabled) return

  const subcircuit = keepout.getSubcircuit()
  const { db } = keepout.root!
  const props = keepout._parsedProps
  const primitiveTransform = keepout._computePcbGlobalTransformBeforeLayout()
  const position = applyToPoint(primitiveTransform, { x: 0, y: 0 })
  const decomposedTransform = decomposeTSR(primitiveTransform)
  const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
  const isRotated90Degrees = Math.abs(rotationDegrees - 90) % 180 < 0.01
  const { maybeFlipLayer } = keepout._getPcbPrimitiveFlippedHelpers()
  const layers = (props.layers ?? (props.layer ? [props.layer] : ["top"])).map(
    (layer) =>
      layer === "top" || layer === "bottom" ? maybeFlipLayer(layer) : layer,
  )
  const excludedPcbComponentIds = keepout.getExcludedPcbComponentIds()
  const commonFields = {
    ...(excludedPcbComponentIds.length > 0
      ? { excluded_pcb_component_ids: excludedPcbComponentIds }
      : {}),
    ...(props.allowTraces !== undefined
      ? { allow_traces: props.allowTraces }
      : {}),
    ...(props.allowPlacements !== undefined
      ? { allow_placements: props.allowPlacements }
      : {}),
    ...(props.warningOnly !== undefined
      ? { warning_only: props.warningOnly }
      : {}),
    description: props.description,
    layers,
    pcb_group_id: subcircuit?.getGroup()?.pcb_group_id ?? undefined,
    subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
  }

  let pcbKeepout: PCBKeepout
  if (props.shape === "circle") {
    pcbKeepout = db.pcb_keepout.insert({
      ...commonFields,
      shape: "circle",
      radius: props.radius,
      center: position,
    })
  } else if (props.shape === "rect") {
    pcbKeepout = db.pcb_keepout.insert({
      ...commonFields,
      shape: "rect",
      ...(isRotated90Degrees
        ? { width: props.height, height: props.width }
        : { width: props.width, height: props.height }),
      center: position,
    })
  } else {
    pcbKeepout = db.pcb_keepout.insert({
      ...commonFields,
      shape: "outline",
      outline: props.outline.map((point) =>
        applyToPoint(primitiveTransform, point),
      ),
      stroke_width: props.strokeWidth,
    })
  }

  keepout.pcb_keepout_id = pcbKeepout.pcb_keepout_id
}
