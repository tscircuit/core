import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("canonical parsed board keeps scoped via keepout", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board name="A" width={30} height={20} routingDisabled>
      <keepout
        shape="rect"
        width={8}
        height={6}
        allowTraces
        allowPlacements
        layers={["top", "bottom"]}
      />
      <resistor name="R1" resistance="1k" footprint="1206" pcbX={-9} />
      <resistor name="R2" resistance="1k" footprint="1206" pcbX={9} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const original = circuit.getCircuitJson()
  const circuitJson = original.map((item) =>
    item.type === "pcb_board" ? pcb_board.parse(item) : item,
  )
  const group = circuit.db.source_group.list().find((g) => g.name === "A")!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id: group.subcircuit_id,
  })
  expect(simpleRouteJson.viaKeepouts).toHaveLength(1)
})
