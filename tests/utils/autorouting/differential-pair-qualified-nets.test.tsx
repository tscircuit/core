import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { expect, test } from "bun:test"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("qualified net selectors route and surface preparation errors", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  const asyncErrors: string[] = []
  circuit.on("asyncEffect:end", (e) => {
    if (e.error) asyncErrors.push(String(e.error))
  })
  circuit.add(
    <board width={18} height={10} schematicDisabled autorouter="auto_local">
      <group name="G">
        <net name="P" />
        <net name="N" />
      </group>
      <chip name="U1" footprint={differentialPairPathPads()} pcbX={-5} />
      <chip name="U2" footprint={differentialPairPathPads()} pcbX={5} />
      <trace from=".U1 > .pin1" to=".G net.P" />
      <trace from=".U2 > .pin1" to=".G net.P" />
      <trace from=".U1 > .pin2" to=".G net.N" />
      <trace from=".U2 > .pin2" to=".G net.N" />
      <differentialpair
        name="PAIR"
        positiveConnection=".G net.P"
        negativeConnection=".G net.N"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(asyncErrors).toEqual([])
  expect(inputs).toHaveLength(1)
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [
        circuit.db.source_net.getWhere({ name: "P" })!.source_net_id,
        circuit.db.source_net.getWhere({ name: "N" })!.source_net_id,
      ],
      lengthTolerance: 0.1,
    },
  ])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
})
