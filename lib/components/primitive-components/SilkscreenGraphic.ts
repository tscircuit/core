import { silkscreenGraphicProps } from "@tscircuit/props"
import {
  PNG_MIMETYPE,
  SVG_MIMETYPE,
  ensureClockwise,
  getSvgBRepShapes,
  getTransformedSvgPathRoutes,
  loadImageSource,
} from "@tscircuit/image-utils"
import type { PcbSilkscreenGraphic } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SilkscreenGraphic extends PrimitiveComponent<
  typeof silkscreenGraphicProps
> {
  pcb_silkscreen_graphic_id: string | null = null
  pcb_silkscreen_graphic_ids: string[] = []
  pcb_silkscreen_path_ids: string[] = []
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "SilkscreenGraphic",
      zodProps: silkscreenGraphicProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return

    this._queueAsyncEffect("SilkscreenGraphicRender", async () => {
      if (this.root?.pcbDisabled) return
      const { db } = this.root!
      const { _parsedProps: props } = this
      const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
      const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

      if (layer !== "top" && layer !== "bottom") {
        throw new Error(
          `Invalid layer "${layer}" for SilkscreenGraphic. Must be "top" or "bottom".`,
        )
      }

      const sourceImage = await loadImageSource(props.imageUrl)

      if (
        sourceImage.mimetype !== SVG_MIMETYPE &&
        sourceImage.mimetype !== PNG_MIMETYPE
      ) {
        throw new Error(
          `Unsupported imageUrl for SilkscreenGraphic: "${props.imageUrl}". Expected an SVG or PNG image.`,
        )
      }

      const imageAsset = {
        project_relative_path: sourceImage.projectRelativePath,
        url: sourceImage.dataUrl,
        mimetype: sourceImage.mimetype,
      }
      const brepShapes =
        sourceImage.mimetype === SVG_MIMETYPE
          ? getSvgBRepShapes({
              svg: sourceImage.text,
              width: props.width,
              height: props.height,
              transform: this._computePcbGlobalTransformBeforeLayout(),
            })
          : [this.getPlacementBoxBRepShape()]

      const pcbComponentId =
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        ""

      for (const brepShape of brepShapes) {
        const graphic = (db as any).insert({
          type: "pcb_silkscreen_graphic",
          pcb_component_id: pcbComponentId,
          pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
          subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
          layer,
          shape: "brep",
          brep_shape: brepShape,
          image_asset: imageAsset,
        } satisfies Omit<
          PcbSilkscreenGraphic,
          "pcb_silkscreen_graphic_id"
        >) as PcbSilkscreenGraphic

        this.pcb_silkscreen_graphic_ids.push(graphic.pcb_silkscreen_graphic_id)
      }

      this.pcb_silkscreen_graphic_id =
        this.pcb_silkscreen_graphic_ids[0] ?? null

      if (sourceImage.mimetype === SVG_MIMETYPE) {
        this.insertRenderableSilkscreenPaths(sourceImage.text, layer)
      }
    })
  }

  insertRenderableSilkscreenPaths(svg: string, layer: "top" | "bottom"): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id ??
      ""

    for (const route of getTransformedSvgPathRoutes({
      svg,
      width: props.width,
      height: props.height,
      transform,
    })) {
      if (route.length < 2) continue

      const path = db.pcb_silkscreen_path.insert({
        pcb_component_id,
        layer,
        route,
        stroke_width: Math.max(Math.min(props.width, props.height) / 60, 0.05),
        subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
      this.pcb_silkscreen_path_ids.push(path.pcb_silkscreen_path_id)
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }

  getPlacementBoxBRepShape(): PcbSilkscreenGraphic["brep_shape"] {
    const { _parsedProps: props } = this
    const halfWidth = props.width / 2
    const halfHeight = props.height / 2
    const transform = this._computePcbGlobalTransformBeforeLayout()

    return {
      outer_ring: {
        vertices: ensureClockwise([
          { x: -halfWidth, y: halfHeight },
          { x: halfWidth, y: halfHeight },
          { x: halfWidth, y: -halfHeight },
          { x: -halfWidth, y: -halfHeight },
        ]).map((point: { x: number; y: number }) =>
          applyToPoint(transform, point),
        ),
      },
      inner_rings: [],
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!

    const moveVertex = (vertex: { x: number; y: number; bulge?: number }) => ({
      ...vertex,
      x: vertex.x + deltaX,
      y: vertex.y + deltaY,
    })

    for (const graphicId of this.pcb_silkscreen_graphic_ids) {
      const graphic = (db as any).pcb_silkscreen_graphic.get(
        graphicId,
      ) as PcbSilkscreenGraphic | null

      if (!graphic) continue
      db.pcb_silkscreen_graphic.update(graphicId, {
        brep_shape: {
          outer_ring: {
            vertices: graphic.brep_shape.outer_ring.vertices.map(moveVertex),
          },
          inner_rings: graphic.brep_shape.inner_rings.map((ring) => ({
            vertices: ring.vertices.map(moveVertex),
          })),
        },
      })
    }

    for (const pathId of this.pcb_silkscreen_path_ids) {
      const path = db.pcb_silkscreen_path.get(pathId)
      if (!path) continue

      db.pcb_silkscreen_path.update(pathId, {
        route: path.route.map((point) => ({
          ...point,
          x: point.x + deltaX,
          y: point.y + deltaY,
        })),
      })
    }
  }
}
