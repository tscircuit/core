import {
  type Bounds,
  doBoundsOverlap,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import {
  type SilkscreenLabelCandidate,
  type SilkscreenLabelCandidateContext,
  generateMovedSilkscreenLabelCandidates,
  getCurrentSpotCandidate,
} from "./generate-silkscreen-label-candidates"
import { getLabelPairCost } from "./get-label-spot-cost"
import { expandBounds, getBoundsUnion } from "./label-geometry"
import {
  createBoundsIndex,
  createSilkscreenLabelSpatialIndex,
  searchBoundsIndex,
} from "./silkscreen-label-spatial-index"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelObstacleKind,
  SilkscreenLabelPlacement,
  SilkscreenLabelPlacementOptions,
  SilkscreenLabelPlacementSolverParams,
} from "./types"

export const DEFAULT_SILKSCREEN_LABEL_PLACEMENT_OPTIONS: SilkscreenLabelPlacementOptions =
  {
    partGap: 0.2,
    ownPartGap: 0.2,
    ownPartHugGap: 0.05,
    labelClearance: 0.15,
    boardEdgeMargin: 0.2,
    candidateStep: 0.25,
    maxPushOut: 3,
    maxEjectedLabels: 3,
    maxEjectionTargets: 24,
    maxPasses: 40,
    costToMove: 20,
  }

type SolverStage = "descent" | "ejection"

// Smaller cost differences are floating-point noise
const COST_TOLERANCE = 1e-9

const OBSTACLE_FILL_BY_KIND: Record<SilkscreenLabelObstacleKind, string> = {
  copper: "rgba(200, 120, 40, 0.45)",
  hole: "rgba(90, 90, 90, 0.45)",
  cutout: "rgba(90, 90, 90, 0.45)",
  silkscreen: "rgba(120, 120, 220, 0.45)",
  text: "rgba(70, 120, 210, 0.3)",
  note: "rgba(70, 120, 210, 0.15)",
  mounted_board: "rgba(60, 140, 90, 0.2)",
}

/**
 * Moves reference designator labels off pads, holes, silkscreen, other text,
 * each other and the board edge, keeping each nearest its own part. A solver
 * places the labels of one side of the board.
 *
 * Every label starts on its current spot, which costs nothing unless it has an
 * issue; when no label has one, setup solves it. A label gets its other spots
 * the first time it has an issue, since without one it never moves. Descent
 * passes then move each label, in refdes order, to its cheapest candidate
 * given the others. Ejection passes let a label with an issue take a
 * spot held by up to `maxEjectedLabels` others when that lowers the total cost.
 * Both repeat until neither improves; no randomness, ties keep the earlier
 * choice.
 */
export class SilkscreenLabelPlacementSolver extends BaseSolver {
  params: SilkscreenLabelPlacementSolverParams
  options: SilkscreenLabelPlacementOptions
  labels: MovableSilkscreenLabel[]
  candidateContextByLabelIndex: SilkscreenLabelCandidateContext[] = []
  candidatesByLabelIndex: SilkscreenLabelCandidate[][] = []
  hasMovedCandidatesByLabelIndex: boolean[] = []
  chosenCandidateIndexByLabelIndex: number[] = []
  /** Bounds of all the label's candidates. */
  reachByLabelIndex: Bounds[] = []
  neighborLabelIndicesByLabelIndex: number[][] = []
  stage: SolverStage = "descent"
  reachedMaxPasses = false

  constructor(params: SilkscreenLabelPlacementSolverParams) {
    super()
    this.params = params
    this.options = {
      ...DEFAULT_SILKSCREEN_LABEL_PLACEMENT_OPTIONS,
      ...params.options,
    }
    this.labels = [...params.labels].sort((a, b) =>
      a.text.localeCompare(b.text, "en", { numeric: true }),
    )
    this.MAX_ITERATIONS = this.options.maxPasses
  }

  override getConstructorParams() {
    return [this.params] as const
  }

  override _setup() {
    const spatialIndex = createSilkscreenLabelSpatialIndex(this.params)
    this.candidateContextByLabelIndex = this.labels.map((label) => ({
      label,
      layer: this.params.layer,
      part: spatialIndex.getPartOfLabelOrThrow(label),
      spatialIndex,
      boardOutline: this.params.boardOutline,
      options: this.options,
    }))
    this.candidatesByLabelIndex = this.candidateContextByLabelIndex.map(
      (candidateContext) => [getCurrentSpotCandidate(candidateContext)],
    )
    this.hasMovedCandidatesByLabelIndex = this.labels.map(() => false)
    this.chosenCandidateIndexByLabelIndex = this.labels.map(() => 0)
    this.updateNeighborLabelIndices()
    if (this.labels.every((_, labelIndex) => !this.hasIssue(labelIndex)))
      this.solved = true
    this.updateStats()
  }

  /** Labels are neighbors when any of their candidates can come close. */
  updateNeighborLabelIndices() {
    this.reachByLabelIndex = this.candidatesByLabelIndex.map((candidates) =>
      getBoundsUnion(candidates.map((candidate) => candidate.bounds)),
    )
    const reachIndex = createBoundsIndex(this.reachByLabelIndex)
    this.neighborLabelIndicesByLabelIndex = this.reachByLabelIndex.map(
      (reach, labelIndex) =>
        searchBoundsIndex(
          reachIndex,
          reach,
          this.options.labelClearance,
        ).filter((otherLabelIndex) => otherLabelIndex !== labelIndex),
    )
  }

  /**
   * Generates the label's other spots the first time it has an issue, and the
   * neighbors they bring.
   */
  addMovedCandidatesOnIssue(labelIndex: number) {
    if (
      this.hasMovedCandidatesByLabelIndex[labelIndex] ||
      !this.hasIssue(labelIndex)
    )
      return
    this.hasMovedCandidatesByLabelIndex[labelIndex] = true
    const candidates = this.candidatesByLabelIndex[labelIndex]!
    candidates.push(
      ...generateMovedSilkscreenLabelCandidates(
        this.candidateContextByLabelIndex[labelIndex]!,
      ),
    )

    const reach = getBoundsUnion(
      candidates.map((candidate) => candidate.bounds),
    )
    this.reachByLabelIndex[labelIndex] = reach
    const searchBounds = expandBounds(reach, this.options.labelClearance)
    const neighborLabelIndices: number[] = []
    this.reachByLabelIndex.forEach((otherReach, otherLabelIndex) => {
      if (
        otherLabelIndex === labelIndex ||
        !doBoundsOverlap(searchBounds, otherReach)
      )
        return
      neighborLabelIndices.push(otherLabelIndex)
      const otherNeighborLabelIndices =
        this.neighborLabelIndicesByLabelIndex[otherLabelIndex]!
      if (!otherNeighborLabelIndices.includes(labelIndex)) {
        otherNeighborLabelIndices.push(labelIndex)
        otherNeighborLabelIndices.sort((a, b) => a - b)
      }
    })
    this.neighborLabelIndicesByLabelIndex[labelIndex] = neighborLabelIndices
  }

  override _step() {
    if (this.stage === "descent") {
      if (!this.runDescentPass()) this.stage = "ejection"
    } else if (this.runEjectionPass()) {
      this.stage = "descent"
    } else {
      this.solved = true
    }
    // Full stats visit every label, so they are only computed once solved
    if (this.solved) this.updateStats()
    else
      Object.assign(this.stats, { stage: this.stage, passes: this.iterations })
  }

  // No pass raises the total cost, so the placement reached so far is kept
  override tryFinalAcceptance() {
    this.reachedMaxPasses = true
    this.solved = true
    this.updateStats()
  }

  getChosenCandidate(labelIndex: number): SilkscreenLabelCandidate {
    return this.candidatesByLabelIndex[labelIndex]![
      this.chosenCandidateIndexByLabelIndex[labelIndex]!
    ]!
  }

  getCandidateCostGivenOtherLabels(
    labelIndex: number,
    candidate: SilkscreenLabelCandidate,
  ): number {
    let cost = candidate.ownCost
    for (const neighborLabelIndex of this.neighborLabelIndicesByLabelIndex[
      labelIndex
    ]!) {
      cost += getLabelPairCost(
        candidate.bounds,
        this.getChosenCandidate(neighborLabelIndex).bounds,
        this.options.labelClearance,
      )
    }
    return cost
  }

  /** Ties keep the chosen candidate, then the earlier one. */
  getBestCandidateIndex(labelIndex: number): number {
    const candidates = this.candidatesByLabelIndex[labelIndex]!
    let bestCandidateIndex = this.chosenCandidateIndexByLabelIndex[labelIndex]!
    let bestCost = this.getCandidateCostGivenOtherLabels(
      labelIndex,
      candidates[bestCandidateIndex]!,
    )
    candidates.forEach((candidate, candidateIndex) => {
      // Pair costs are never negative, so a candidate whose own cost is no
      // lower cannot win.
      if (candidate.ownCost >= bestCost - COST_TOLERANCE) return
      const cost = this.getCandidateCostGivenOtherLabels(labelIndex, candidate)
      if (cost < bestCost - COST_TOLERANCE) {
        bestCost = cost
        bestCandidateIndex = candidateIndex
      }
    })
    return bestCandidateIndex
  }

  runDescentPass(): boolean {
    let moved = false
    this.labels.forEach((_, labelIndex) => {
      this.addMovedCandidatesOnIssue(labelIndex)
      const bestCandidateIndex = this.getBestCandidateIndex(labelIndex)
      if (
        bestCandidateIndex !== this.chosenCandidateIndexByLabelIndex[labelIndex]
      ) {
        this.chosenCandidateIndexByLabelIndex[labelIndex] = bestCandidateIndex
        moved = true
      }
    })
    return moved
  }

  getLabelIndicesInConflictWith(labelIndex: number, bounds: Bounds): number[] {
    return this.neighborLabelIndicesByLabelIndex[labelIndex]!.filter(
      (neighborLabelIndex) =>
        getLabelPairCost(
          bounds,
          this.getChosenCandidate(neighborLabelIndex).bounds,
          this.options.labelClearance,
        ) > 0,
    )
  }

  hasIssue(labelIndex: number): boolean {
    const chosenCandidate = this.getChosenCandidate(labelIndex)
    return (
      chosenCandidate.hasIssue ||
      this.getLabelIndicesInConflictWith(labelIndex, chosenCandidate.bounds)
        .length > 0
    )
  }

  /** Own costs of the labels plus their pair costs, each pair counted once. */
  getCostOfLabelSet(labelIndices: number[]): number {
    const labelIndexSet = new Set(labelIndices)
    let cost = 0
    for (const labelIndex of labelIndices) {
      const chosenCandidate = this.getChosenCandidate(labelIndex)
      cost += chosenCandidate.ownCost
      for (const neighborLabelIndex of this.neighborLabelIndicesByLabelIndex[
        labelIndex
      ]!) {
        if (
          labelIndexSet.has(neighborLabelIndex) &&
          neighborLabelIndex < labelIndex
        )
          continue
        cost += getLabelPairCost(
          chosenCandidate.bounds,
          this.getChosenCandidate(neighborLabelIndex).bounds,
          this.options.labelClearance,
        )
      }
    }
    return cost
  }

  /**
   * A label with an issue tries its cheapest better candidates; the labels in
   * the way move to their best other spots, and the change is kept only if the
   * total cost drops.
   */
  runEjectionPass(): boolean {
    let improved = false
    this.labels.forEach((_, labelIndex) => {
      if (!this.hasIssue(labelIndex)) return
      this.addMovedCandidatesOnIssue(labelIndex)
      const candidates = this.candidatesByLabelIndex[labelIndex]!
      const chosenCandidateIndex =
        this.chosenCandidateIndexByLabelIndex[labelIndex]!
      const currentCost = this.getCandidateCostGivenOtherLabels(
        labelIndex,
        candidates[chosenCandidateIndex]!,
      )
      // Ejecting from the chosen spot is a descent pass's job
      const targetCandidateIndices = candidates
        .map((_, candidateIndex) => candidateIndex)
        .filter(
          (candidateIndex) =>
            candidateIndex !== chosenCandidateIndex &&
            candidates[candidateIndex]!.ownCost < currentCost - COST_TOLERANCE,
        )
        .sort(
          (a, b) => candidates[a]!.ownCost - candidates[b]!.ownCost || a - b,
        )
        .slice(0, this.options.maxEjectionTargets)
      for (const targetCandidateIndex of targetCandidateIndices) {
        const ejectedLabelIndices = this.getLabelIndicesInConflictWith(
          labelIndex,
          candidates[targetCandidateIndex]!.bounds,
        )
        if (
          ejectedLabelIndices.length === 0 ||
          ejectedLabelIndices.length > this.options.maxEjectedLabels
        )
          continue
        const involvedLabelIndices = [labelIndex, ...ejectedLabelIndices]
        const costBefore = this.getCostOfLabelSet(involvedLabelIndices)
        const savedChoices = involvedLabelIndices.map(
          (involvedLabelIndex) =>
            this.chosenCandidateIndexByLabelIndex[involvedLabelIndex]!,
        )
        this.chosenCandidateIndexByLabelIndex[labelIndex] = targetCandidateIndex
        for (const ejectedLabelIndex of ejectedLabelIndices) {
          this.addMovedCandidatesOnIssue(ejectedLabelIndex)
          this.chosenCandidateIndexByLabelIndex[ejectedLabelIndex] =
            this.getBestCandidateIndex(ejectedLabelIndex)
        }
        if (
          this.getCostOfLabelSet(involvedLabelIndices) <
          costBefore - COST_TOLERANCE
        ) {
          improved = true
          return
        }
        involvedLabelIndices.forEach((involvedLabelIndex, i) => {
          this.chosenCandidateIndexByLabelIndex[involvedLabelIndex] =
            savedChoices[i]!
        })
      }
    })
    return improved
  }

  updateStats() {
    const labelIndices = this.labels.map((_, labelIndex) => labelIndex)
    this.stats = {
      stage: this.stage,
      passes: this.iterations,
      labels: this.labels.length,
      movedLabels: labelIndices.filter(
        (labelIndex) =>
          this.getChosenCandidate(labelIndex).ccwRotation !== null,
      ).length,
      labelsWithIssues: labelIndices.filter((labelIndex) =>
        this.hasIssue(labelIndex),
      ).length,
      totalCost: Math.round(this.getCostOfLabelSet(labelIndices) * 100) / 100,
      reachedMaxPasses: this.reachedMaxPasses,
    }
  }

  /** Returns the placements of the labels that moved. */
  override getOutput(): SilkscreenLabelPlacement[] {
    return this.labels.flatMap((label, labelIndex) => {
      const { bounds, ccwRotation } = this.getChosenCandidate(labelIndex)
      if (ccwRotation === null) return []
      return [
        {
          pcbSilkscreenTextId: label.pcbSilkscreenTextId,
          center: getBoundsCenter(bounds),
          ccwRotation,
        },
      ]
    })
  }

  override visualize(): GraphicsObject {
    const toRect = (bounds: Bounds) => ({
      center: getBoundsCenter(bounds),
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    })
    const graphics: Required<
      Pick<GraphicsObject, "rects" | "lines" | "points">
    > = { rects: [], lines: [], points: [] }

    const { boardOutline } = this.params
    if (boardOutline) {
      graphics.lines.push({
        points: [...boardOutline, boardOutline[0]!],
        strokeColor: "#888888",
      })
    }
    for (const part of this.params.parts) {
      graphics.rects.push({
        ...toRect(part.bounds),
        stroke: "rgba(200, 160, 60, 0.8)",
      })
    }
    for (const obstacle of this.params.obstacles) {
      graphics.rects.push({
        ...toRect(obstacle.bounds),
        fill: OBSTACLE_FILL_BY_KIND[obstacle.kind],
      })
    }
    this.labels.forEach((label, labelIndex) => {
      // Before the first step, labels are drawn where they start
      if (!this._setupDone) {
        graphics.rects.push({
          ...toRect(label.currentBounds),
          stroke: "rgba(60, 170, 90, 0.9)",
          label: label.text,
        })
        return
      }
      const chosenCandidate = this.getChosenCandidate(labelIndex)
      const hasIssue = this.hasIssue(labelIndex)
      graphics.rects.push({
        ...toRect(chosenCandidate.bounds),
        fill: hasIssue ? "rgba(230, 60, 60, 0.35)" : "rgba(60, 170, 90, 0.3)",
        label: `${label.text}: ${chosenCandidate.ccwRotation === null ? "kept" : "moved"}, cost ${chosenCandidate.ownCost.toFixed(1)}`,
      })
      if (!hasIssue) return
      for (const candidate of this.candidatesByLabelIndex[labelIndex]!) {
        graphics.points.push({
          ...getBoundsCenter(candidate.bounds),
          color: "rgba(230, 60, 60, 0.5)",
        })
      }
    })
    return {
      ...graphics,
      coordinateSystem: "cartesian",
      title: `Silkscreen label placement (${this.params.layer})`,
    }
  }
}
