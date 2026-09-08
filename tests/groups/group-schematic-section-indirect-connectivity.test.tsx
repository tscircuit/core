import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/matchpack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("retain section connectivity through an external chip pin", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const inputs: InputProblem[] = []
  circuit.enableDebug("Group_doInitialSchematicLayoutMatchpack")
  circuit.on("debug:logOutput", (event) => {
    if (event.name?.startsWith("matchpack-input-problem-")) {
      if (typeof event.content === "string")
        inputs.push(JSON.parse(event.content))
      else inputs.push(event.content)
    }
  })
  circuit.add(
    <board routingDisabled>
      <schematicsection name="controller" />
      <schematicsection name="controls" />
      <chip name="U1" schSectionName="controller" pinLabels={{ pin1: "RUN" }} />
      <resistor name="R1" resistance="10k" schSectionName="controls" />
      <resistor name="R2" resistance="1k" schSectionName="controls" />
      <trace from=".R1 > .pin1" to=".U1 > .pin1" />
      <trace from=".R2 > .pin1" to=".U1 > .pin1" />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin2" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const controls = inputs.find(
    (input) => input.chipMap.R1 && input.chipMap.R2 && !input.chipMap.U1,
  )!
  expect(controls).toBeDefined()
  const sharedNets = Object.keys(controls.netMap).filter(
    (netId) =>
      controls.netConnMap[`R1.1-${netId}`] &&
      controls.netConnMap[`R2.1-${netId}`],
  )
  expect(sharedNets).toHaveLength(1)
  expect(controls.netMap[sharedNets[0]!]!.isGround).toBe(false)
  expect(controls.netMap[sharedNets[0]!]!.isPositiveVoltageSource).toBe(false)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
