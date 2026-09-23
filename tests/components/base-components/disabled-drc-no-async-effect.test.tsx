import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import type { Board } from "lib/components/normal-components/Board"

test("disabled DRC does not schedule an empty async effect or repeat render phases", async () => {
  const circuit = new RootCircuit({
    platform: { drcChecksDisabled: true, partsEngineDisabled: true },
  })
  circuit.add(<board width={10} height={10} />)
  const effects: string[] = []
  let sourceRenderPhases = 0
  circuit.on("asyncEffect:start", (event) => effects.push(event.effectName))
  circuit.on("board:renderPhaseStarted", (event) => {
    if (event.phase === "SourceRender") sourceRenderPhases++
  })
  await circuit.renderUntilSettled()
  expect(effects).not.toContain("board:drc-checks")
  expect(sourceRenderPhases).toBe(1)
  expect((circuit._getBoard() as Board)._drcChecksComplete).toBe(true)
})
