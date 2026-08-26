import type { BoardOutlinePoint } from "@tscircuit/props"
import {
  type AnyCircuitElement,
  type PcbPlatedHoleCircle,
  distance,
} from "circuit-json"
import { PlatedHole } from "../primitive-components/PlatedHole"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"
import type { Board } from "./Board"

const CASTELLATED_HOLE_ENDPOINT_TOLERANCE_MM = 1e-6

const getConnectionTargets = (
  connectsTo: BoardOutlinePoint["connectsTo"],
): string[] => {
  if (!connectsTo) return []
  return Array.isArray(connectsTo) ? connectsTo : [connectsTo]
}

export class BoardCastellatedHole extends PlatedHole {
  readonly outlinePointIndex: number
  readonly holeDiameter: number
  readonly padDiameter: number
  readonly port: Port | null
  readonly trace: Trace | null

  static fromBoardOutline(
    outline: BoardOutlinePoint[] | undefined,
  ): BoardCastellatedHole[] {
    return (outline ?? []).flatMap((outlinePoint, outlinePointIndex) =>
      outlinePoint.isCastellatedHole
        ? [new BoardCastellatedHole(outlinePoint, outlinePointIndex)]
        : [],
    )
  }

  constructor(outlinePoint: BoardOutlinePoint, outlinePointIndex: number) {
    const name = `castellated_hole_${outlinePointIndex + 1}`
    const connectionTargets = getConnectionTargets(outlinePoint.connectsTo)
    const holeDiameter = distance.parse(outlinePoint.holeDiameter!)
    const padDiameter = distance.parse(outlinePoint.padDiameter!)

    super({
      shape: "circle",
      holeDiameter,
      outerDiameter: padDiameter,
      portHints: [name],
    })

    this.outlinePointIndex = outlinePointIndex
    this.holeDiameter = holeDiameter
    this.padDiameter = padDiameter
    this.port = connectionTargets.length > 0 ? new Port({ name }) : null
    this.trace = this.port
      ? new Trace({
          path: [`port.${name}`, ...connectionTargets],
          displayName: `Castellated hole ${outlinePointIndex + 1} connectivity`,
        })
      : null
  }

  private _getParentBoard(): Board {
    if (this.parent?.componentName !== "Board") {
      throw new Error("A board castellated hole must be a direct board child")
    }
    return this.parent as Board
  }

  /**
   * Returns the castellation center as a point in the right-handed PCB world
   * XY frame (+X right, +Y top), in millimeters. The emitted board outline is
   * the canonical source, so this point already includes every translation.
   */
  private _getPositionFromBoardOutline(): { x: number; y: number } {
    const board = this._getParentBoard()
    const pcbBoard = board.pcb_board_id
      ? board.root?.db.pcb_board.get(board.pcb_board_id)
      : null
    const outlinePoint = pcbBoard?.outline?.[this.outlinePointIndex]
    if (!outlinePoint) {
      throw new Error(
        `Missing emitted board outline point ${this.outlinePointIndex}`,
      )
    }
    return outlinePoint
  }

  override _getGlobalPcbPositionBeforeLayout(): { x: number; y: number } {
    return this._getPositionFromBoardOutline()
  }

  override doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return

    const { db } = this.root!
    const position = this._getPositionFromBoardOutline()
    const pcbPlatedHole = db.pcb_plated_hole.insert({
      shape: "circle",
      outer_diameter: this.padDiameter,
      hole_diameter: this.holeDiameter,
      ...position,
      layers: this.getAvailablePcbLayers(),
      port_hints: this.getNameAndAliases(),
      subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
    } as Omit<PcbPlatedHoleCircle, "type" | "pcb_plated_hole_id">)
    this.pcb_plated_hole_id = pcbPlatedHole.pcb_plated_hole_id
  }

  syncPositionToBoardOutline(): void {
    if (!this.pcb_plated_hole_id) return
    this._setPositionFromLayout(this._getPositionFromBoardOutline())
  }

  removePcbPrimitiveRender(): void {
    const { db } = this.root!
    if (this.pcb_plated_hole_id) {
      db.pcb_plated_hole.delete(this.pcb_plated_hole_id)
      this.pcb_plated_hole_id = null
    }
    if (this.matchedPort?.pcb_port_id) {
      db.pcb_port.delete(this.matchedPort.pcb_port_id)
      this.matchedPort.pcb_port_id = null
    }
  }

  isExpectedBoardEdgeDrcError(result: AnyCircuitElement): boolean {
    if (!this.pcb_plated_hole_id) return false

    if (result.type === "pcb_placement_error") {
      return (
        result.pcb_placement_error_id ===
        `copper_too_close_to_board_edge_${this.pcb_plated_hole_id}`
      )
    }

    if (
      result.type !== "pcb_trace_error" ||
      !result.pcb_trace_error_id.startsWith("trace_too_close_to_board_")
    ) {
      return false
    }

    const segmentIndexMatch = result.pcb_trace_error_id.match(/_segment_(\d+)$/)
    if (!segmentIndexMatch) return false

    const pcbTrace = this.root?.db.pcb_trace.get(result.pcb_trace_id)
    const segmentIndex = Number(segmentIndexMatch[1])
    const segmentEndpoints = [
      pcbTrace?.route[segmentIndex],
      pcbTrace?.route[segmentIndex + 1],
    ].flatMap((routePoint) =>
      routePoint && "x" in routePoint && "y" in routePoint
        ? [{ x: routePoint.x, y: routePoint.y }]
        : [],
    )
    const platedHole = this.root?.db.pcb_plated_hole.get(
      this.pcb_plated_hole_id,
    )
    if (!platedHole) return false

    return segmentEndpoints.some(
      (endpoint) =>
        Math.hypot(endpoint.x - platedHole.x, endpoint.y - platedHole.y) <=
        CASTELLATED_HOLE_ENDPOINT_TOLERANCE_MM,
    )
  }
}
