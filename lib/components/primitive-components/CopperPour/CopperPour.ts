import { copperPourProps, type CopperPourProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Net } from "../Net"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import Flatten from "@flatten-js/core"
import { getBoardPolygon } from "./utils/get-board-polygon"
import { processObstaclesForPour } from "./utils/process-obstacles"
import { generateAndInsertBRep } from "./utils/generate-and-insert-brep"

const circleToPolygon = (circle: Flatten.Circle, numSegments = 32) => {
  const points: Flatten.Point[] = []
  for (let i = 0; i < numSegments; i++) {
    const angle = (i / numSegments) * 2 * Math.PI
    points.push(
      new Flatten.Point(
        circle.center.x + circle.r * Math.cos(angle),
        circle.center.y + circle.r * Math.sin(angle),
      ),
    )
  }
  return new Flatten.Polygon(points)
}

export { type CopperPourProps }

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 }
  }

  doInitialPcbCopperPourRender() {
    if (this.root?.pcbDisabled) return
    this._queueAsyncEffect("PcbCopperPourRender", async () => {
      const { db } = this.root!
      const { _parsedProps: props } = this

      const net = this.getSubcircuit().selectOne(props.connectsTo) as Net | null
      if (!net || !net.source_net_id) {
        this.renderError(`Net "${props.connectsTo}" not found for copper pour`)
        return
      }

      const board = db.pcb_board.list()[0]
      if (!board) {
        this.renderError("No board found for copper pour")
        return
      }

      const boardPolygon = getBoardPolygon(board)

      const connMap = getFullConnectivityMapFromCircuitJson(db.toArray())

      const obstaclesRaw = getObstaclesFromCircuitJson(
        db.toArray(),
        connMap,
      ).filter((o) => o.layers.includes(props.layer))

      console.log(`[copper-pour] found ${obstaclesRaw.length} obstacles total`)

      const { rectObstaclesToSubtract, circularObstacles } =
        processObstaclesForPour(obstaclesRaw, connMap, net, {
          traceMargin: props.traceMargin ?? 0.2,
          padMargin: props.padMargin ?? 0.2,
        })

      let pourPolygons: Flatten.Polygon | Flatten.Polygon[] = boardPolygon
      if (rectObstaclesToSubtract.length > 0) {
        for (const rect of rectObstaclesToSubtract) {
          pourPolygons = Flatten.BooleanOperations.subtract(pourPolygons, rect)
        }
      }

      for (const circ of circularObstacles) {
        const circleShape = new Flatten.Circle(
          Flatten.point(circ.center.x, circ.center.y),
          circ.radius,
        )
        const circlePolygon = circleToPolygon(circleShape)
        pourPolygons = Flatten.BooleanOperations.subtract(
          pourPolygons,
          circlePolygon,
        )
      }

      generateAndInsertBRep(pourPolygons, [], {
        db,
        copperPour: this,
      })
    })
  }
}
