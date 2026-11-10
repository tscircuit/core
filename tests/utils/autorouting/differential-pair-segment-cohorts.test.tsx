import { validateDifferentialPairSourceBuses } from "lib/utils/autorouting/validateDifferentialPairSourceBuses"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { expect, test } from "bun:test"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects differential SRJ segment cohorts", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        name="DDR_CLOCK"
        positiveConnection="CK_t"
        negativeConnection="CK_c"
        maxLengthSkew="50um"
      />
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace name="CK_t" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="CK_c" from=".U1 > .pin2" to=".U2 > .pin2" />
    </board>,
  )

  circuit.render()

  const sourcePairs = validateDifferentialPairSourceBuses(circuit.db)
  const srj = getSimpleRouteJsonFromCircuitJson({ db: circuit.db }).simpleRouteJson
  const splitConnections = srj.connections.flatMap((connection) => [connection, { ...connection, routingPcbGroupId: "local" }])
  expect(() => getDifferentialPairsForSimpleRouteJson({ srjConnections: splitConnections, sourcePairs })).toThrow("phased, preserved and breakout splitting is unsupported")
})
