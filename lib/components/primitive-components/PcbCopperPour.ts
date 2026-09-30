import { pcbCopperPourProps, type PcbCopperPourProps } from "@tscircuit/props"
import type { Ring } from "circuit-json"
import {
  applyToPoint,
  compose,
  decomposeTSR,
  type Matrix,
  rotateDEG,
  translate,
} from "transformation-matrix"
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

export type { PcbCopperPourProps }

/**
 * Inserts precomputed copper geometry expressed in footprint-local millimetres.
 * +X points right and +Y points toward the top of the board. The primitive
 * applies its parent footprint transform before writing board-world geometry.
 */
export class PcbCopperPour extends PrimitiveComponent<
  typeof pcbCopperPourProps
> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PcbCopperPour",
      zodProps: pcbCopperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return

    const { db } = this.root!
    const props = this._parsedProps
    const subcircuit = this.getSubcircuit()
    const parentTransform = this._computePcbGlobalTransformBeforeLayout()
    const { isFlipped, maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const commonFields = {
      covered_with_solder_mask: props.coveredWithSolderMask,
      layer: maybeFlipLayer(props.layer),
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      source_net_id: props.sourceNetId,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    }

    if (props.shape === "polygon") {
      db.pcb_copper_pour.insert({
        ...commonFields,
        shape: "polygon",
        points: props.points.map((point) =>
          applyToPoint(parentTransform, point),
        ),
      })
      return
    }

    if (props.shape === "brep") {
      db.pcb_copper_pour.insert({
        ...commonFields,
        shape: "brep",
        brep_shape: {
          outer_ring: transformBrepRing({
            isFlipped,
            parentTransform,
            ring: props.brepShape.outer_ring,
          }),
          inner_rings: props.brepShape.inner_rings.map((ring) =>
            transformBrepRing({ isFlipped, parentTransform, ring }),
          ),
        },
      })
      return
    }

    if (isFlipped) {
      const rectToBoardTransform = compose(
        parentTransform,
        translate(props.pcbX, props.pcbY),
        rotateDEG(props.pcbRotation ?? 0),
      )
      const halfWidth = props.width / 2
      const halfHeight = props.height / 2

      db.pcb_copper_pour.insert({
        ...commonFields,
        shape: "polygon",
        points: [
          { x: -halfWidth, y: -halfHeight },
          { x: halfWidth, y: -halfHeight },
          { x: halfWidth, y: halfHeight },
          { x: -halfWidth, y: halfHeight },
        ].map((point) => applyToPoint(rectToBoardTransform, point)),
      })
      return
    }

    const parentRotationDegrees =
      (decomposeTSR(parentTransform).rotation.angle * 180) / Math.PI
    db.pcb_copper_pour.insert({
      ...commonFields,
      shape: "rect",
      center: applyToPoint(parentTransform, {
        x: props.pcbX,
        y: props.pcbY,
      }),
      width: props.width,
      height: props.height,
      rotation: (props.pcbRotation ?? 0) + parentRotationDegrees,
    })
  }
}
