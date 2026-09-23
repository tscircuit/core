import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("implicit copper pours are disabled even when explicitly enabled", async () => {
  const circuit = new RootCircuit()
  const phases: string[] = []
  const solvers: string[] = []
  circuit.on("board:renderPhaseStarted", ({ phase }) => phases.push(phase))
  circuit.on("solver:started", ({ solverName }) => solvers.push(solverName))
  circuit.add(
    <board width={10} height={10} automaticPoursEnabled>
      <net name="GND" isGroundNet />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        connections={{ pin1: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(phases).not.toContain("PcbImplicitCopperPourRender")
  expect(solvers).not.toContain("ImplicitCopperPourPipelineSolver")
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
  expect(phases).toContain("PcbCopperPourRender")
  expect(phases).toContain("PcbDesignRuleChecks")
})
