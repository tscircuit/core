import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("group min via rules flow into simple route json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group subcircuit minViaDiameter="0.55mm" minViaHole="0.25mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </group>,
  )

  await circuit.renderUntilSettled()

  const subcircuitId = circuit.db.source_group.list()[0]?.subcircuit_id
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: subcircuitId,
  })

  expect(simpleRouteJson.minViaDiameter).toBe(0.55)
  expect(simpleRouteJson.minViaHole).toBe(0.25)
})
