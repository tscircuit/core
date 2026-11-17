import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import type { SolverName } from "lib/solvers"
import type { H3RoutingStage } from "tests/fixtures/h3-routing-phase-intent/run"
import { hasNativeH3RoutingSolverEvidence } from "../../fixtures/h3-routing-phase-intent/solver-evidence"

test("native H3 keeps layout in the full timeline and correlates actual routing solver events", () => {
  const solverNames: SolverName[] = [
    "LayoutPipelineSolver",
    "BusLanesPipelineSolver",
    "BusLanesPipelineSolver",
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  ]
  const stages: H3RoutingStage[] = ["byte0", "byte1", "remaining"].map(
    (phaseName, routingPhaseIndex) => {
      const solverName = solverNames[routingPhaseIndex + 1]!
      const start: AutoroutingStartEvent = {
        type: "autorouting:start",
        subcircuit_id: "native_board",
        componentDisplayName: "Native H3 board",
        phaseName,
        phaseStageIndex: 0,
        phaseStageCount: 1,
        routingPhaseIndex,
        _actualRoutingPhaseOrderIndex: routingPhaseIndex,
        solverName,
        simpleRouteJson: {
          layerCount: 2,
          minTraceWidth: 0.1,
          bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 },
          obstacles: [],
          connections: [],
        },
      }
      const solverEvents: H3RoutingStage["solverEvents"] = [
        {
          type: "solver:started",
          solverName,
          componentName: start.componentDisplayName,
        },
      ]
      if (routingPhaseIndex < 2)
        solverEvents.push({
          type: "solver:ended",
          solverName,
          componentName: start.componentDisplayName,
        })
      return { start, end: { ...start, type: "autorouting:end" }, solverEvents }
    },
  )
  const verifies = (candidateStages: H3RoutingStage[]) =>
    hasNativeH3RoutingSolverEvidence({ stages: candidateStages, solverNames })
  expect(verifies(stages)).toBe(true)
  const failedFinal = structuredClone(stages)
  failedFinal[2]!.error = {
    ...failedFinal[2]!.start,
    type: "autorouting:error",
    error: { message: "Routing did not complete" },
  }
  delete failedFinal[2]!.end
  // Correct observation order is distinct from successful routing. Existing
  // completion, DRC, accepted-report and connectivity gates still reject this.
  expect(verifies(failedFinal)).toBe(true)

  const missingConstructor = structuredClone(stages)
  missingConstructor[0]!.solverEvents!.shift()
  expect(verifies(missingConstructor)).toBe(false)
  const extraConstructor = structuredClone(stages)
  extraConstructor[1]!.solverEvents!.unshift(
    extraConstructor[1]!.solverEvents![0]!,
  )
  expect(verifies(extraConstructor)).toBe(false)
  const wrongConstructor = structuredClone(stages)
  wrongConstructor[2]!.solverEvents![0]!.solverName = "BusLanesPipelineSolver"
  expect(verifies(wrongConstructor)).toBe(false)
  const foreignConstructor = structuredClone(stages)
  foreignConstructor[0]!.solverEvents![0]!.componentName = "Another board"
  expect(verifies(foreignConstructor)).toBe(false)
  const reversedEvents = structuredClone(stages)
  reversedEvents[0]!.solverEvents!.reverse()
  expect(verifies(reversedEvents)).toBe(false)
  const missingBusEnd = structuredClone(stages)
  missingBusEnd[1]!.solverEvents!.pop()
  expect(verifies(missingBusEnd)).toBe(false)
  const wrongBusEnd = structuredClone(stages)
  wrongBusEnd[0]!.solverEvents![1]!.componentName = "Another board"
  expect(verifies(wrongBusEnd)).toBe(false)
  const noTerminal = structuredClone(stages)
  delete noTerminal[2]!.end
  expect(verifies(noTerminal)).toBe(false)
  const differentTerminalPhase = structuredClone(stages)
  differentTerminalPhase[1]!.end!.phaseName = "byte0"
  expect(verifies(differentTerminalPhase)).toBe(false)
  const differentTerminalComponent = structuredClone(stages)
  differentTerminalComponent[2]!.end!.componentDisplayName = "Another board"
  expect(verifies(differentTerminalComponent)).toBe(false)
  const differentTerminalSubcircuit = structuredClone(stages)
  differentTerminalSubcircuit[0]!.end!.subcircuit_id = "another_board"
  expect(verifies(differentTerminalSubcircuit)).toBe(false)
  const differentTerminalSolver = structuredClone(stages)
  differentTerminalSolver[2]!.end!.solverName = "BusLanesPipelineSolver"
  expect(verifies(differentTerminalSolver)).toBe(false)
  const duplicatedTerminal = structuredClone(stages)
  duplicatedTerminal[2]!.error = {
    ...duplicatedTerminal[2]!.start,
    type: "autorouting:error",
  }
  expect(verifies(duplicatedTerminal)).toBe(false)
  const wrongExecutionOrder = structuredClone(stages)
  wrongExecutionOrder[1]!.start._actualRoutingPhaseOrderIndex = 0
  expect(verifies(wrongExecutionOrder)).toBe(false)
  expect(verifies([stages[1]!, stages[0]!, stages[2]!])).toBe(false)
  expect(
    hasNativeH3RoutingSolverEvidence({
      stages,
      solverNames: solverNames.slice(1),
    }),
  ).toBe(false)
  expect(
    hasNativeH3RoutingSolverEvidence({
      stages,
      solverNames: [...solverNames, "FanoutSolver"],
    }),
  ).toBe(false)
})
