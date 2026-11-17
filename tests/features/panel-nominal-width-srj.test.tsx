import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unscoped SRJ export applies widths from each connection's owning board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel>
      <board
        name="A"
        width={12}
        height={8}
        pcbX={-8}
        defaultTraceWidth={0.35}
        minTraceWidth={0.1}
        routingDisabled
      >
        <resistor name="R1" resistance={100} footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance={100} footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>
      <board
        name="B"
        width={12}
        height={8}
        pcbX={8}
        defaultTraceWidth={0.6}
        minTraceWidth={0.1}
        routingDisabled
      >
        <resistor name="R3" resistance={100} footprint="0402" pcbX={-2} />
        <resistor name="R4" resistance={100} footprint="0402" pcbX={2} />
        <trace from=".R3 > .pin1" to="net.SIG" />
        <trace from=".R4 > .pin1" to="net.SIG" />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  const input = { circuitJson: circuit.getCircuitJson() }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson(input)
  expect(
    simpleRouteJson.connections.map((c) => c.nominalTraceWidth).sort(),
  ).toEqual([0.35, 0.6])
  expect(
    getSimpleRouteJsonFromCircuitJson({
      ...input,
      nominalTraceWidth: 0.42,
    }).simpleRouteJson.connections.map((c) => c.width),
  ).toEqual([0.42, 0.42])
})
