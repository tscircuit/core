import { expect, test } from "bun:test"
import type { SolverEndedEvent, SolverStartedEvent } from "lib/events"
import { SOLVERS } from "lib/solvers"
import type { SilkscreenLabelPlacementSolverParams } from "lib/utils/silkscreen-label-placement/types"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen label placement solver events replay the placement", async () => {
  const { circuit } = getTestFixture()
  const started: SolverStartedEvent[] = []
  const ended: SolverEndedEvent[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SilkscreenLabelPlacementSolver")
      started.push(event)
  })
  circuit.on("solver:ended", (event) => {
    if (event.solverName === "SilkscreenLabelPlacementSolver") ended.push(event)
  })

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <pcbnotetext
        pcbY={3.2}
        fontSize={0.4}
        text="Capacitors 1 mm apart: labels moved clear of each other"
      />
      {Array.from({ length: 6 }, (_, i) => (
        <capacitor
          key={`C${i + 1}`}
          name={`C${i + 1}`}
          capacitance="100nF"
          footprint="0402"
          pcbX={-2.5 + i}
          pcbY={0}
          pcbRotation={90}
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(started).toHaveLength(1)
  expect(ended).toHaveLength(1)
  expect(ended[0]).toMatchObject({ solved: true, failed: false, error: null })

  const args: [SilkscreenLabelPlacementSolverParams] = JSON.parse(
    JSON.stringify(started[0]!.solverConstructorArgs),
  )
  const replay = new SOLVERS.SilkscreenLabelPlacementSolver(...args)
  // Before its first step the solver draws every part, obstacle and label
  const { parts, obstacles, labels } = args[0]
  expect(replay.visualize().rects).toHaveLength(
    parts.length + obstacles.length + labels.length,
  )
  replay.solve()
  expect(replay.iterations).toBe(ended[0]!.iterations)

  const placements = replay.getOutput()
  expect(placements.length).toBeGreaterThan(0)
  for (const placement of placements) {
    const placedText = circuit.db.pcb_silkscreen_text.get(
      placement.pcbSilkscreenTextId,
    )!
    expect(placedText.anchor_position).toEqual(placement.center)
    expect(placedText.ccw_rotation).toBe(placement.ccwRotation)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
