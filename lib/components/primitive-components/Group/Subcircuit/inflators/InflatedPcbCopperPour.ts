import type { PcbCopperPour, Ring } from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../../../../base-components/PrimitiveComponent"

const inflatedPcbCopperPourProps = z.object({})

export class InflatedPcbCopperPour extends PrimitiveComponent<
  typeof inflatedPcbCopperPourProps
> {
  isPcbPrimitive = true

  constructor(
    private readonly originalPcbCopperPour: PcbCopperPour,
    private readonly sourceNetName?: string,
  ) {
    super({})
  }

  get config() {
    return {
      componentName: "InflatedPcbCopperPour",
      zodProps: inflatedPcbCopperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    if (this.originalPcbCopperPour.shape === "rect") {
      const rotationRadians =
        ((this.originalPcbCopperPour.rotation ?? 0) * Math.PI) / 180
      const cos = Math.abs(Math.cos(rotationRadians))
      const sin = Math.abs(Math.sin(rotationRadians))
      return {
        width:
          this.originalPcbCopperPour.width * cos +
          this.originalPcbCopperPour.height * sin,
        height:
          this.originalPcbCopperPour.width * sin +
          this.originalPcbCopperPour.height * cos,
      }
    }

    const points =
      this.originalPcbCopperPour.shape === "polygon"
        ? this.originalPcbCopperPour.points
        : [
            ...this.originalPcbCopperPour.brep_shape.outer_ring.vertices,
            ...this.originalPcbCopperPour.brep_shape.inner_rings.flatMap(
              (ring) => ring.vertices,
            ),
          ]
    const xs = points.map((point) => Number(point.x))
    const ys = points.map((point) => Number(point.y))
    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }

  doInitialPcbCopperPourRender(): void {
    if (this.root?.pcbDisabled) return

    const { db } = this.root!
    const subcircuit = this.getSubcircuit()
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const sourceNet = this.sourceNetName
      ? db.source_net
          .list()
          .find(
            (net) =>
              net.name === this.sourceNetName &&
              net.subcircuit_id === subcircuit.subcircuit_id,
          )
      : undefined
    const commonFields = {
      layer: maybeFlipLayer(this.originalPcbCopperPour.layer),
      covered_with_solder_mask:
        this.originalPcbCopperPour.covered_with_solder_mask,
      source_net_id: sourceNet?.source_net_id,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    }

    if (this.originalPcbCopperPour.shape === "brep") {
      const transformRing = (ring: Ring) => ({
        vertices: ring.vertices.map((vertex) => ({
          ...vertex,
          ...applyToPoint(transform, vertex),
          bulge:
            vertex.bulge === undefined
              ? undefined
              : vertex.bulge *
                (transform.a * transform.d - transform.b * transform.c < 0
                  ? -1
                  : 1),
        })),
      })

      db.pcb_copper_pour.insert({
        ...commonFields,
        shape: "brep",
        brep_shape: {
          outer_ring: transformRing(
            this.originalPcbCopperPour.brep_shape.outer_ring,
          ),
          inner_rings:
            this.originalPcbCopperPour.brep_shape.inner_rings.map(
              transformRing,
            ),
        },
      })
      return
    }

    if (this.originalPcbCopperPour.shape === "polygon") {
      db.pcb_copper_pour.insert({
        ...commonFields,
        shape: "polygon",
        points: this.originalPcbCopperPour.points.map((point) =>
          applyToPoint(transform, point),
        ),
      })
      return
    }

    const { rotation, scale } = decomposeTSR(transform)
    db.pcb_copper_pour.insert({
      ...commonFields,
      shape: "rect",
      center: applyToPoint(transform, this.originalPcbCopperPour.center),
      width: Math.abs(scale.sx) * this.originalPcbCopperPour.width,
      height: Math.abs(scale.sy) * this.originalPcbCopperPour.height,
      rotation:
        (this.originalPcbCopperPour.rotation ?? 0) +
        (rotation.angle * 180) / Math.PI,
    })
  }
}
