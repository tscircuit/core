import {
  type SilkscreenGraphicProps as PublicSilkscreenGraphicProps,
  silkscreenGraphicProps as publicSilkscreenGraphicProps,
} from "@tscircuit/props"
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
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"
import { imageToBrepShapes } from "lib/utils/image/silkscreen-graphics"

const internalImportedSilkscreenGraphicProps = z.object({
  layer: visible_layer.optional(),
  brepShape: brep_shape,
  imageAsset: asset.optional(),
})

const silkscreenGraphicProps = z.union([
  publicSilkscreenGraphicProps,
  internalImportedSilkscreenGraphicProps,
])

type ParsedSilkscreenGraphicProps = z.infer<typeof silkscreenGraphicProps>

const isImageSilkscreenGraphicProps = (
  props: ParsedSilkscreenGraphicProps,
): props is Extract<ParsedSilkscreenGraphicProps, { imageUrl: string }> =>
  "imageUrl" in props && typeof props.imageUrl === "string"

const isImportedBrepSilkscreenGraphicProps = (
  props: ParsedSilkscreenGraphicProps,
): props is z.infer<typeof internalImportedSilkscreenGraphicProps> =>
  "brepShape" in props &&
  Boolean(props.brepShape) &&
  !("imageUrl" in props && typeof props.imageUrl === "string")

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

const getBoundsFromVertices = (
  vertices: Array<{ x: number; y: number }>,
  transform: Parameters<typeof applyToPoint>[0],
) => {
  if (vertices.length === 0) return { width: 0, height: 0 }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const vertex of vertices) {
    const transformed = applyToPoint(transform, vertex)
    minX = Math.min(minX, transformed.x)
    maxX = Math.max(maxX, transformed.x)
    minY = Math.min(minY, transformed.y)
    maxY = Math.max(maxY, transformed.y)
  }

  return {
    width: maxX - minX,
    height: maxY - minY,
  }
}

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
  pcb_silkscreen_graphic_ids: string[] = []
  isPcbPrimitive = true
  _hasStartedImageLoad = false

  get config() {
    return {
      componentName: "SilkscreenGraphic",
      zodProps: silkscreenGraphicProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { _parsedProps: props } = this
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for SilkscreenGraphic. Must be "top" or "bottom".`,
      )
    }

    if (isImportedBrepSilkscreenGraphicProps(props)) {
      if (this.pcb_silkscreen_graphic_ids.length > 0) return
      this._insertBrepShapes([props.brepShape], layer, props.imageAsset)
      return
    }

    if (!isImageSilkscreenGraphicProps(props)) {
      throw new Error(
        "SilkscreenGraphic must receive either imageUrl/width/height or an internal brepShape",
      )
    }

    if (this._hasStartedImageLoad) return
    this._hasStartedImageLoad = true

    this._queueAsyncEffect("load-silkscreen-graphic-image", async () => {
      const resolvedUrl = await resolveStaticFileImport(
        props.imageUrl,
        this.root?.platform,
      )

      const response = await fetch(resolvedUrl)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch silkscreen graphic "${resolvedUrl}": ${response.status}`,
        )
      }

      const imageData = await response.arrayBuffer()
      const brepShapes = await imageToBrepShapes({
        importedImageBytes: imageData,
        contentType: response.headers.get("content-type") ?? undefined,
        sourceName: resolvedUrl,
        width: props.width,
        height: props.height,
      })

      this._insertBrepShapes(brepShapes, layer, {
        project_relative_path: props.imageUrl,
        url: resolvedUrl,
        mimetype:
          response.headers.get("content-type") ||
          (resolvedUrl.toLowerCase().endsWith(".svg")
            ? "image/svg+xml"
            : "application/octet-stream"),
      })
    })
  }

  private _insertBrepShapes(
    brepShapes: BRepShape[],
    layer: "top" | "bottom",
    imageAsset: z.infer<typeof asset> | undefined,
  ) {
    if (brepShapes.length === 0) {
      throw new Error("SilkscreenGraphic requires at least one BRep shape")
    }

    const { db } = this.root!
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    for (const brepShape of brepShapes) {
      const pcbSilkscreenGraphic = db.pcb_silkscreen_graphic.insert({
        pcb_component_id,
        pcb_group_id: group?.pcb_group_id ?? undefined,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        layer,
        shape: "brep",
        image_asset: imageAsset,
        brep_shape: {
          outer_ring: transformRing(brepShape.outer_ring, transform),
          inner_rings: brepShape.inner_rings.map((ring) =>
            transformRing(ring, transform),
          ),
        },
      })

      this.pcb_silkscreen_graphic_ids.push(
        pcbSilkscreenGraphic.pcb_silkscreen_graphic_id,
      )
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    if (this.pcb_silkscreen_graphic_ids.length === 0) return

    const currentShapes = this.pcb_silkscreen_graphic_ids
      .map((id) => db.pcb_silkscreen_graphic.get(id))
      .filter(Boolean)

    if (currentShapes.length === 0) return

    const currentCenter = getBrepCenter({
      outer_ring: {
        vertices: currentShapes.flatMap(
          (shape) => shape!.brep_shape.outer_ring.vertices,
        ),
      },
      inner_rings: currentShapes.flatMap(
        (shape) => shape!.brep_shape.inner_rings,
      ),
    })

    for (const graphic of currentShapes) {
      db.pcb_silkscreen_graphic.update(graphic!.pcb_silkscreen_graphic_id, {
        brep_shape: translateBrepShape(
          graphic!.brep_shape,
          newCenter.x - currentCenter.x,
          newCenter.y - currentCenter.y,
        ),
      })
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    for (const id of this.pcb_silkscreen_graphic_ids) {
      const graphic = db.pcb_silkscreen_graphic.get(id)
      if (!graphic) continue

      db.pcb_silkscreen_graphic.update(id, {
        brep_shape: translateBrepShape(graphic.brep_shape, deltaX, deltaY),
      })
    }
  }

  getPcbSize(): { width: number; height: number } {
    const transform = this._computePcbGlobalTransformBeforeLayout()

    if (isImageSilkscreenGraphicProps(this._parsedProps)) {
      const halfWidth = this._parsedProps.width / 2
      const halfHeight = this._parsedProps.height / 2
      return getBoundsFromVertices(
        [
          { x: -halfWidth, y: -halfHeight },
          { x: halfWidth, y: -halfHeight },
          { x: halfWidth, y: halfHeight },
          { x: -halfWidth, y: halfHeight },
        ],
        transform,
      )
    }

    return getBoundsFromVertices(
      getBrepVertices(this._parsedProps.brepShape),
      transform,
    )
  }
}
