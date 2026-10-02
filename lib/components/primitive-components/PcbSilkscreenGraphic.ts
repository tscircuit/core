import {
  pcbSilkscreenGraphicProps,
  type PcbSilkscreenGraphicProps,
} from "@tscircuit/props"
import type { Ring } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const transformBrepRing = ({
  isFlipped,
  parentTransform,
  ring,
}: {
  isFlipped: boolean
  parentTransform: Matrix
  ring: Ring
}): Ring => {
  if (!isFlipped) {
    return {
      vertices: ring.vertices.map((vertex) => ({
        ...applyToPoint(parentTransform, vertex),
        ...(vertex.bulge !== undefined ? { bulge: vertex.bulge } : {}),
      })),
    }
  }

  const vertexCount = ring.vertices.length
  return {
    vertices: ring.vertices.toReversed().map((vertex, reversedIndex) => {
      const sourceVertexIndex = vertexCount - 1 - reversedIndex
      const precedingSourceVertex =
        ring.vertices[(sourceVertexIndex - 1 + vertexCount) % vertexCount]

      return {
        ...applyToPoint(parentTransform, vertex),
        ...(precedingSourceVertex?.bulge !== undefined
          ? { bulge: -precedingSourceVertex.bulge }
          : {}),
      }
    }),
  }
}

export type { PcbSilkscreenGraphicProps }

/**
 * Inserts precomputed silkscreen geometry expressed in footprint-local
 * millimetres. The primitive applies its parent footprint transform before
 * writing board-world geometry.
 */
export class PcbSilkscreenGraphic extends PrimitiveComponent<
  typeof pcbSilkscreenGraphicProps
> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbSilkscreenGraphic",
      zodProps: pcbSilkscreenGraphicProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const vertices = this._parsedProps.brepShape.outer_ring.vertices
    const xCoordinates = vertices.map((vertex) => vertex.x)
    const yCoordinates = vertices.map((vertex) => vertex.y)

    return {
      width: Math.max(...xCoordinates) - Math.min(...xCoordinates),
      height: Math.max(...yCoordinates) - Math.min(...yCoordinates),
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return

    const { db } = this.root!
    const props = this._parsedProps
    const primitiveTransform = this._computePcbGlobalTransformBeforeLayout()
    const { isFlipped, maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer)

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(`Invalid silkscreen layer: ${layer}`)
    }

    db.pcb_silkscreen_graphic.insert({
      brep_shape: {
        outer_ring: transformBrepRing({
          isFlipped,
          parentTransform: primitiveTransform,
          ring: props.brepShape.outer_ring,
        }),
        inner_rings: props.brepShape.inner_rings.map((ring) =>
          transformBrepRing({
            isFlipped,
            parentTransform: primitiveTransform,
            ring,
          }),
        ),
      },
      image_asset: props.imageAsset,
      layer,
      pcb_component_id:
        this.parent?.pcb_component_id ??
        this.getPrimitiveContainer()?.pcb_component_id ??
        "",
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      shape: "brep",
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
    })
  }
}
