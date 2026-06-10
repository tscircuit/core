import {
  asset,
  brep_shape,
  type BRepShape,
  type Ring,
  visible_layer,
} from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"
import { z } from "zod"

const silkscreenGraphicProps = z.object({
  layer: visible_layer.optional(),
  brepShape: brep_shape,
  imageAsset: asset.optional(),
})

const transformRing = (
  ring: Ring,
  transform: Parameters<typeof applyToPoint>[0],
) => ({
  vertices: ring.vertices.map((vertex) => {
    const transformed = applyToPoint(transform, { x: vertex.x, y: vertex.y })
    return {
      ...vertex,
      x: transformed.x,
      y: transformed.y,
    }
  }),
})

const translateBrepShape = (
  brepShape: BRepShape,
  deltaX: number,
  deltaY: number,
): BRepShape => ({
  outer_ring: {
    vertices: brepShape.outer_ring.vertices.map((vertex) => ({
      ...vertex,
      x: vertex.x + deltaX,
      y: vertex.y + deltaY,
    })),
  },
  inner_rings: brepShape.inner_rings.map((ring) => ({
    vertices: ring.vertices.map((vertex) => ({
      ...vertex,
      x: vertex.x + deltaX,
      y: vertex.y + deltaY,
    })),
  })),
})

const getBrepVertices = (brepShape: BRepShape) => [
  ...brepShape.outer_ring.vertices,
  ...brepShape.inner_rings.flatMap((ring) => ring.vertices),
]

const getBrepCenter = (brepShape: BRepShape) => {
  const vertices = getBrepVertices(brepShape)
  if (vertices.length === 0) return { x: 0, y: 0 }

  let x = 0
  let y = 0
  for (const vertex of vertices) {
    x += vertex.x
    y += vertex.y
  }

  return {
    x: x / vertices.length,
    y: y / vertices.length,
  }
}

export class SilkscreenGraphic extends PrimitiveComponent<
  typeof silkscreenGraphicProps
> {
  pcb_silkscreen_graphic_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenGraphic",
      zodProps: silkscreenGraphicProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenGraphic. Must be "top" or "bottom".`,
      )
    }

    const pcbSilkscreenGraphic = db.pcb_silkscreen_graphic.insert({
      pcb_component_id,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      layer,
      shape: "brep",
      image_asset: props.imageAsset,
      brep_shape: {
        outer_ring: transformRing(props.brepShape.outer_ring, transform),
        inner_rings: props.brepShape.inner_rings.map((ring) =>
          transformRing(ring, transform),
        ),
      },
    })

    this.pcb_silkscreen_graphic_id =
      pcbSilkscreenGraphic.pcb_silkscreen_graphic_id
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    if (!this.pcb_silkscreen_graphic_id) return

    const currentGraphic = db.pcb_silkscreen_graphic.get(
      this.pcb_silkscreen_graphic_id,
    )
    if (!currentGraphic) return

    const currentCenter = getBrepCenter(currentGraphic.brep_shape)
    db.pcb_silkscreen_graphic.update(this.pcb_silkscreen_graphic_id, {
      brep_shape: translateBrepShape(
        currentGraphic.brep_shape,
        newCenter.x - currentCenter.x,
        newCenter.y - currentCenter.y,
      ),
    })
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_silkscreen_graphic_id) return

    const graphic = db.pcb_silkscreen_graphic.get(
      this.pcb_silkscreen_graphic_id,
    )
    if (!graphic) return

    db.pcb_silkscreen_graphic.update(this.pcb_silkscreen_graphic_id, {
      brep_shape: translateBrepShape(graphic.brep_shape, deltaX, deltaY),
    })
  }

  getPcbSize(): { width: number; height: number } {
    const vertices = getBrepVertices(this._parsedProps.brepShape)
    if (vertices.length === 0) {
      return { width: 0, height: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x)
      maxX = Math.max(maxX, vertex.x)
      minY = Math.min(minY, vertex.y)
      maxY = Math.max(maxY, vertex.y)
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
