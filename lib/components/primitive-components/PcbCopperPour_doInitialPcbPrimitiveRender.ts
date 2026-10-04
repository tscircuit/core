import type { Ring } from "circuit-json"
import { type Matrix, applyToPoint, decomposeTSR } from "transformation-matrix"
import type { Net } from "./Net"
import type { PcbCopperPour } from "./PcbCopperPour"

/**
 * Converts a B-rep ring from footprint-local millimetres (+X right, +Y board
 * top) into board-world millimetres. A bottom-side footprint reverses winding;
 * each arc bulge therefore moves to the preceding source edge and changes sign.
 */
function transformBrepRing({
  footprintLocalToBoardTransform,
  isFlipped,
  ring,
}: {
  footprintLocalToBoardTransform: Matrix
  isFlipped: boolean
  ring: Ring
}): Ring {
  if (!isFlipped) {
    return {
      vertices: ring.vertices.map((vertex) => ({
        ...applyToPoint(footprintLocalToBoardTransform, vertex),
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
        ...applyToPoint(footprintLocalToBoardTransform, vertex),
        ...(precedingSourceVertex?.bulge !== undefined
          ? { bulge: -precedingSourceVertex.bulge }
          : {}),
      }
    }),
  }
}

export function PcbCopperPour_doInitialPcbPrimitiveRender(
  pcbCopperPour: PcbCopperPour,
): void {
  if (pcbCopperPour.root?.pcbDisabled) return

  const { db } = pcbCopperPour.root!
  const { _parsedProps } = pcbCopperPour
  const subcircuit = pcbCopperPour.getSubcircuit()
  const sourceNetId = _parsedProps.connectsTo
    ? subcircuit.selectOne<Net>(_parsedProps.connectsTo)?.source_net_id
    : undefined
  if (_parsedProps.connectsTo && !sourceNetId) {
    pcbCopperPour.renderError(
      `Net "${_parsedProps.connectsTo}" not found for precomputed copper pour`,
    )
    return
  }

  // Primitive geometry is authored in the containing footprint's local frame;
  // this matrix carries points into the board-world frame emitted to Circuit JSON.
  const footprintLocalToBoardTransform =
    pcbCopperPour._computePcbGlobalTransformBeforeLayout()
  const { isFlipped, maybeFlipLayer } =
    pcbCopperPour._getPcbPrimitiveFlippedHelpers()
  const copperPourFields = {
    covered_with_solder_mask: _parsedProps.coveredWithSolderMask,
    layer:
      _parsedProps.layer === "top" || _parsedProps.layer === "bottom"
        ? maybeFlipLayer(_parsedProps.layer)
        : _parsedProps.layer,
    pcb_group_id: pcbCopperPour.getGroup()?.pcb_group_id ?? undefined,
    source_net_id: sourceNetId,
    subcircuit_id: subcircuit.subcircuit_id ?? undefined,
  }

  if (_parsedProps.shape === "polygon") {
    db.pcb_copper_pour.insert({
      ...copperPourFields,
      shape: "polygon",
      points: _parsedProps.points.map((point) =>
        applyToPoint(footprintLocalToBoardTransform, point),
      ),
    })
    return
  }

  if (_parsedProps.shape === "brep") {
    db.pcb_copper_pour.insert({
      ...copperPourFields,
      shape: "brep",
      brep_shape: {
        outer_ring: transformBrepRing({
          footprintLocalToBoardTransform,
          isFlipped,
          ring: _parsedProps.brepShape.outer_ring,
        }),
        inner_rings: _parsedProps.brepShape.inner_rings.map((ring) =>
          transformBrepRing({
            footprintLocalToBoardTransform,
            isFlipped,
            ring,
          }),
        ),
      },
    })
    return
  }

  if (isFlipped) {
    const halfWidth = _parsedProps.width / 2
    const halfHeight = _parsedProps.height / 2

    db.pcb_copper_pour.insert({
      ...copperPourFields,
      shape: "polygon",
      points: [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
      ].map((point) => applyToPoint(footprintLocalToBoardTransform, point)),
    })
    return
  }

  const boardCcwRotationDegrees =
    (decomposeTSR(footprintLocalToBoardTransform).rotation.angle * 180) /
    Math.PI
  db.pcb_copper_pour.insert({
    ...copperPourFields,
    shape: "rect",
    center: applyToPoint(footprintLocalToBoardTransform, { x: 0, y: 0 }),
    width: _parsedProps.width,
    height: _parsedProps.height,
    rotation: boardCcwRotationDegrees,
  })
}
