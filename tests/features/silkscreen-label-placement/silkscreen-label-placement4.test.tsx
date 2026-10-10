import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import type { SilkscreenLabelPlacementSolverParams } from "lib/utils/silkscreen-label-placement/types"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen labels of parts in a nested subcircuit are placed with the board's", async () => {
  const { circuit } = getTestFixture()
  const started: SolverStartedEvent[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SilkscreenLabelPlacementSolver")
      started.push(event)
  })

  circuit.add(
    <board width="8mm" height="8mm" routingDisabled>
      <pcbnotetext
        pcbY={4.6}
        fontSize={0.4}
        text="C1 and C2 are in a subcircuit: R1's label leaves C1, C2's label leaves R1"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <group name="G1" subcircuit pcbX={0} pcbY={0}>
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={1.22}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={-1.22}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(started).toHaveLength(1)
  const params: SilkscreenLabelPlacementSolverParams = started[0]!.solverParams
  expect(params.labels.map((label) => label.text).sort()).toEqual([
    "C1",
    "C2",
    "R1",
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
