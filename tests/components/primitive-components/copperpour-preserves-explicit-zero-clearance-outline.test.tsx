import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour preserves an explicit zero-clearance outline", async () => {
  const { circuit } = getTestFixture()
  const outline = [
    { x: -4, y: -3 },
    { x: 4, y: -3 },
    { x: 2, y: 3 },
    { x: -4, y: 2 },
  ]
  const startedSolverNames: string[] = []
  circuit.on("solver:started", ({ solverName }) => {
    startedSolverNames.push(solverName)
  })

  circuit.add(
    <board width="16mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <trace from=".R1 > .pin1" to="net.GND" />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={outline}
        padMargin={0}
        traceMargin={0}
        clearance={0}
        boardEdgeMargin={0}
        cutoutMargin={0}
        useThermalReliefs={false}
      />
      <pcbnotetext
        text="AUTHORED OUTLINE PRESERVED"
        pcbX={0}
        pcbY={4}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(startedSolverNames).not.toContain("CopperPourPipelineSolver")
  expect(circuit.db.pcb_copper_pour.list()).toMatchObject([
    {
      shape: "polygon",
      points: outline,
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
