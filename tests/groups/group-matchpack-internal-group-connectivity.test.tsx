import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/matchpack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internal group wiring does not create outer placement nets", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const inputs: InputProblem[] = []
  circuit.enableDebug("Group_doInitialSchematicLayoutMatchpack")
  circuit.on("debug:logOutput", (event) => {
    if (!event.name?.startsWith("matchpack-input-problem-")) return
    if (typeof event.content === "string")
      inputs.push(JSON.parse(event.content))
    else inputs.push(event.content)
  })
  circuit.add(
    <board routingDisabled>
      <group>
        <resistor name="R1" resistance="1k" schX={0} />
        <resistor name="R2" resistance="2k" schX={2} />
        <trace from=".R1 > .pin2" to="net.VCC" />
        <trace from=".R2 > .pin1" to="net.GND" />
        <trace from=".R1 > .pin1" to=".R2 > .pin2" />
      </group>
      <group>
        <resistor name="R3" resistance="3k" schX={0} />
        <resistor name="R4" resistance="4k" schX={2} />
        <trace from=".R3 > .pin2" to="net.VCC" />
        <trace from=".R4 > .pin1" to="net.GND" />
        <trace from=".R3 > .pin1" to=".R4 > .pin2" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  const outerInput = inputs.find(
    (input) => input.chipMap.group_0 && input.chipMap.group_1,
  )!
  expect(outerInput).toBeDefined()
  for (const netId of Object.keys(outerInput.netMap)) {
    expect(
      circuit.db.source_net.getWhere({
        subcircuit_connectivity_map_key: netId,
      }),
    ).toBeDefined()
  }
  expect(Object.keys(outerInput.netMap)).toHaveLength(2)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
