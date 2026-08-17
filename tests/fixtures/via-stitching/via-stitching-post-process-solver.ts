import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { BaseSolver } from "@tscircuit/solver-utils"
import type {
  PcbCopperPourRect,
  PcbTrace,
  PcbTraceRoutePointVia,
  PcbVia,
  SourceNet,
  SourceTrace,
} from "circuit-json"

interface PowerLayerTransition {
  pcbTrace: PcbTrace
  routePoint: PcbTraceRoutePointVia
  sourceNet: SourceNet
  sourceTrace: SourceTrace
}

export interface ViaStitchingPostProcessOutput {
  transitionCount: number
  copperPours: PcbCopperPourRect[]
  stitchingVias: PcbVia[]
}

const isTopToBottomTransition = (routePoint: PcbTraceRoutePointVia): boolean =>
  (routePoint.from_layer === "top" && routePoint.to_layer === "bottom") ||
  (routePoint.from_layer === "bottom" && routePoint.to_layer === "top")

/**
 * Test-fixture post-process step that reinforces top-to-bottom power
 * transitions with copper on both outer layers and four same-net stitching
 * vias. It intentionally runs after core has finished routing so it can use
 * the final power-via locations.
 */
export class ViaStitchingPostProcessSolver extends BaseSolver {
  private readonly powerLayerTransitions: PowerLayerTransition[] = []
  private readonly insertedCopperPours: PcbCopperPourRect[] = []
  private readonly insertedStitchingVias: PcbVia[] = []
  private nextTransitionIndex = 0

  constructor(private readonly db: CircuitJsonUtilObjects) {
    super()
  }

  override _setup(): void {
    const sourceNetsById = new Map(
      this.db.source_net
        .list()
        .map((sourceNet) => [sourceNet.source_net_id, sourceNet]),
    )
    const sourceTracesById = new Map(
      this.db.source_trace
        .list()
        .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
    )
    const transitionKeys = new Set<string>()

    for (const pcbTrace of this.db.pcb_trace.list()) {
      if (!pcbTrace.source_trace_id) continue
      const sourceTrace = sourceTracesById.get(pcbTrace.source_trace_id)
      if (!sourceTrace) continue

      const sourceNet = sourceTrace.connected_source_net_ids
        .map((sourceNetId) => sourceNetsById.get(sourceNetId))
        .find(
          (candidate): candidate is SourceNet => candidate?.is_power === true,
        )
      if (!sourceNet) continue

      for (const routePoint of pcbTrace.route) {
        if (
          routePoint.route_type !== "via" ||
          !isTopToBottomTransition(routePoint)
        ) {
          continue
        }

        const transitionKey = [
          sourceNet.source_net_id,
          routePoint.x.toFixed(6),
          routePoint.y.toFixed(6),
        ].join(":")
        if (transitionKeys.has(transitionKey)) continue
        transitionKeys.add(transitionKey)

        this.powerLayerTransitions.push({
          pcbTrace,
          routePoint,
          sourceNet,
          sourceTrace,
        })
      }
    }
  }

  override _step(): void {
    const transition = this.powerLayerTransitions[this.nextTransitionIndex]
    if (!transition) {
      this.solved = true
      this.progress = 1
      return
    }

    this.addCopperPours(transition)
    this.addStitchingVias(transition)
    this.nextTransitionIndex += 1
    this.progress = this.nextTransitionIndex / this.powerLayerTransitions.length
    this.solved = this.nextTransitionIndex === this.powerLayerTransitions.length
  }

  private addCopperPours(transition: PowerLayerTransition): void {
    const { pcbTrace, routePoint, sourceNet } = transition

    for (const layer of ["top", "bottom"] as const) {
      const copperPour = this.db.pcb_copper_pour.insert({
        shape: "rect",
        layer,
        center: { x: routePoint.x, y: routePoint.y },
        width: 2.8,
        height: 2.8,
        source_net_id: sourceNet.source_net_id,
        subcircuit_id: pcbTrace.subcircuit_id,
        pcb_group_id: pcbTrace.pcb_group_id,
        covered_with_solder_mask: false,
      }) as PcbCopperPourRect
      this.insertedCopperPours.push(copperPour)
    }
  }

  private addStitchingVias(transition: PowerLayerTransition): void {
    const { pcbTrace, routePoint, sourceNet, sourceTrace } = transition
    const connectivityKey =
      sourceTrace.subcircuit_connectivity_map_key ??
      sourceNet.subcircuit_connectivity_map_key
    const offsets = [
      { x: -0.75, y: -0.75 },
      { x: -0.75, y: 0.75 },
      { x: 0.75, y: -0.75 },
      { x: 0.75, y: 0.75 },
    ]

    for (const offset of offsets) {
      const stitchingVia = this.db.pcb_via.insert({
        x: routePoint.x + offset.x,
        y: routePoint.y + offset.y,
        hole_diameter: 0.3,
        outer_diameter: 0.6,
        layers: ["top", "bottom"],
        from_layer: "top",
        to_layer: "bottom",
        pcb_trace_id: pcbTrace.pcb_trace_id,
        source_trace_id: sourceTrace.source_trace_id,
        source_net_id: sourceNet.source_net_id,
        subcircuit_id: pcbTrace.subcircuit_id,
        pcb_group_id: pcbTrace.pcb_group_id,
        subcircuit_connectivity_map_key: connectivityKey,
      }) as PcbVia
      this.insertedStitchingVias.push(stitchingVia)
    }
  }

  override getOutput(): ViaStitchingPostProcessOutput {
    return {
      transitionCount: this.powerLayerTransitions.length,
      copperPours: this.insertedCopperPours,
      stitchingVias: this.insertedStitchingVias,
    }
  }
}
