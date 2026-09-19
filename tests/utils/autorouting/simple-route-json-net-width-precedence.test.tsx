import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connected nets and traces retain their largest specified width", async () => {
  for (const widths of [
    { net: undefined, alias: undefined, trace: undefined, expected: 0.2 },
    { net: 0.4, alias: undefined, trace: undefined, expected: 0.4 },
    { net: undefined, alias: 0.6, trace: undefined, expected: 0.6 },
    { net: 0.4, alias: 0.6, trace: 0.3, expected: 0.6 },
    { net: 0.6, alias: 0.4, trace: 0.3, expected: 0.6 },
    { net: 0.4, alias: 0.6, trace: 0.8, expected: 0.8 },
    { net: undefined, alias: undefined, trace: 0.5, expected: 0.5 },
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="12mm" routingDisabled minTraceWidth="0.2mm">
        <net name="VCC" nominalTraceWidth={widths.net} />
        <net name="ALIAS" nominalTraceWidth={widths.alias} />
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} />
        <trace from="net.VCC" to="net.ALIAS" />
        <trace from=".R1 > .pin1" to="net.VCC" thickness={widths.trace} />
        <trace from=".R2 > .pin1" to="net.ALIAS" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.source_net.list().find((net) => net.name === "VCC")
        ?.trace_width,
    ).toBe(widths.net)
    expect(
      circuit.db.source_net.list().find((net) => net.name === "ALIAS")
        ?.trace_width,
    ).toBe(widths.alias)
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
    })
    expect(simpleRouteJson.connections).toHaveLength(1)
    expect(simpleRouteJson.connections[0].nominalTraceWidth).toBe(
      widths.expected,
    )
    expect(simpleRouteJson.connections[0].width).toBe(widths.expected)
  }
})
