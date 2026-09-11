import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/matchpack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("retain section connectivity through an external chip pin", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const inputs: InputProblem[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "LayoutPipelineSolver") {
      inputs.push(event.solverParams)
    }
  })
  circuit.add(
    <board routingDisabled>
      <schematicsection name="controller" />
      <schematicsection name="controls" />
      <chip
        name="U1"
        schSectionName="controller"
        pinLabels={{ pin1: "RUN", pin2: "LED" }}
      />
      <resistor name="R1" resistance="10k" schSectionName="controls" />
      <resistor name="R2" resistance="1k" schSectionName="controls" />
      <resistor name="R3" resistance="330" schSectionName="controls" />
      <trace from=".R3 > .pin1" to=".U1 > .pin2" />
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
  const externalSignalNets = Object.keys(controls.netMap).filter(
    (netId) => controls.netConnMap[`R3.1-${netId}`],
  )
  expect(externalSignalNets).toHaveLength(1)
  expect(controls.netMap[externalSignalNets[0]!]!.isGround).toBe(false)
  expect(controls.netMap[externalSignalNets[0]!]!.isPositiveVoltageSource).toBe(
    false,
  )
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
