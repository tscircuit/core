import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json preserves a ten-layer board layerCount", async () => {
  const { circuit } = getTestFixture()

  // Remove this cast once @tscircuit/props includes 10-layer boards.
  circuit.add(<board width="10mm" height="10mm" layers={10 as 8} />)

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  expect(pcbBoard?.num_layers).toBe(10)
  expect(simpleRouteJson.layerCount).toBe(10)
})
