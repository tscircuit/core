import { copperPourProps, type CopperPourProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Net } from "../Net"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import Flatten from "@flatten-js/core"
import { getBoardPolygon } from "./utils/get-board-polygon"
import { getTraceObstacles } from "./utils/get-trace-obstacles"
import { processObstaclesForPour } from "./utils/process-obstacles"
import { generateAndInsertBRep } from "./utils/generate-and-insert-brep"

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

      obstaclesRaw.push(...getTraceObstacles(db, props.layer))

      const { rectObstaclesToSubtract, circularObstacles } =
        processObstaclesForPour(obstaclesRaw, connMap, net, {
          traceMargin: props.traceMargin ?? 0.2,
          padMargin: props.padMargin ?? 0.2,
        })

      let pourPolygons: Flatten.Polygon | Flatten.Polygon[] = boardPolygon
      if (rectObstaclesToSubtract.length > 0) {
        const obstacleUnion = rectObstaclesToSubtract.reduce((acc, p) =>
          Flatten.BooleanOperations.unify(acc, p),
        )
        if (obstacleUnion && !obstacleUnion.isEmpty()) {
          pourPolygons = Flatten.BooleanOperations.subtract(
            boardPolygon,
            obstacleUnion,
          )
        }
      }

      generateAndInsertBRep(pourPolygons, circularObstacles, {
        db,
        copperPour: this,
      })
    })
  }
}
