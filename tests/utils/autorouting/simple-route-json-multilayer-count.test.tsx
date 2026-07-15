import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json preserves multilayer board layerCount", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<board width="10mm" height="10mm" layers={8} />)

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(pcbBoard?.num_layers).toBe(8)
  expect(simpleRouteJson.layerCount).toBe(8)
})
