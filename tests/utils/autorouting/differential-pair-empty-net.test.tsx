import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("inspect error for an existing net without connected traces", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} schematicDisabled routingDisabled>
      <net name="EMPTY" />
      <differentialpair
        name="PAIR"
        positiveConnection="net.EMPTY"
        negativeConnection="net.EMPTY"
      />
    </board>,
  )
  circuit.render()
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(/Net selector "net.EMPTY" has fewer than two routable terminals/)
})
