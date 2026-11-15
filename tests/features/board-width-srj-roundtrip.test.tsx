import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing input regenerated from serialized board data keeps the authored widths", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      minTraceWidth={0.1}
      defaultTraceWidth="0.35mm"
      routingDisabled
      schematicDisabled
    >
      <resistor name="R1" resistance={100} footprint="1206" pcbX={-4} />
      <resistor name="R2" resistance={100} footprint="1206" pcbX={4} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" thickness="0.55mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson: srj } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: JSON.parse(JSON.stringify(circuit.getCircuitJson())),
  })
  expect(srj.nominalTraceWidth).toBe(0.35)
  expect(
    srj.connections.map((connection) => connection.nominalTraceWidth),
  ).toEqual([0.35, 0.55])
  expect(srj.minTraceWidth).toBe(0.1)
})
