import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { copperPourProps } from "@tscircuit/props"
import Flatten from "@flatten-js/core"
import type { PrimitiveComponent } from "../../../base-components/PrimitiveComponent"
import type { z } from "zod"

const faceToVertices = (face: Flatten.Face) =>
  face.edges.map((e) => {
    const pt: { x: number; y: number; bulge?: number } = {
      x: e.start.x,
      y: e.start.y,
    }
    if (e.isArc) {
      const bulge = Math.tan((e.shape as Flatten.Arc).sweep / 4)
      if (Math.abs(bulge) > 1e-9) {
        pt.bulge = bulge
      }
    }
    return pt
  })

export const generateAndInsertBRep = (
  pourPolygons: Flatten.Polygon | Flatten.Polygon[],
  _circularObstacles: Array<{
    center: { x: number; y: number }
    radius: number
  }>,
  {
    db,
    copperPour,
  }: {
    db: CircuitJsonUtilObjects
    copperPour: PrimitiveComponent<typeof copperPourProps>
  },
) => {
  const props = copperPour._parsedProps as z.infer<typeof copperPourProps>
  const net = copperPour.getSubcircuit().selectOne(props.connectsTo) as any
  const subcircuit = copperPour.getSubcircuit()

  const polygons = Array.isArray(pourPolygons) ? pourPolygons : [pourPolygons]

  for (const p of polygons) {
    const islands = p.splitToIslands()

    for (const island of islands) {
      if (island.isEmpty()) continue

      const faces = [...island.faces] as Flatten.Face[]
      const outer_face_ccw = faces.find(
        (f) => f.orientation() === Flatten.ORIENTATION.CCW,
      )
      const inner_faces_cw = faces.filter(
        (f) => f.orientation() === Flatten.ORIENTATION.CW,
      )

      if (!outer_face_ccw) continue

      if (!db.pcb_copper_pour) {
        copperPour.renderError(
          "db.pcb_copper_pour not found. The database schema may be outdated.",
        )
        return
      }

      // BRep requires outer ring to be CW and inner rings to be CCW.
      // Flatten-js provides outer face as CCW and inner faces as CW.
      // We need to reverse them.
      outer_face_ccw.reverse()
      const outer_ring_vertices = faceToVertices(outer_face_ccw)
      const inner_rings = inner_faces_cw.map((f) => {
        f.reverse()
        return { vertices: faceToVertices(f) }
      })

      db.pcb_copper_pour.insert({
        shape: "brep",
        layer: props.layer,
        brep_shape: {
          outer_ring: { vertices: outer_ring_vertices },
          inner_rings,
        },
        source_net_id: net.source_net_id,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      } as any)
    }
  }
}
