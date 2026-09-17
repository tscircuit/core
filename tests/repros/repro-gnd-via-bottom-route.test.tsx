import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: autorouted bottom GND trace has connected endpoints but no source trace ID", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={5} layers={4} autorouterVersion="beta_pipeline7">
      <net name="GND" />
      {/* Keep the reduced example's via-to-via route on bottom. */}
      <keepout
        shape="rect"
        width={6}
        height={0.3}
        layers={["top", "inner1", "inner2"]}
      />
      <capacitor
        name="C15"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={0.21}
        pcbY={0.8}
        pcbRotation={180}
        pinAttributes={{ pin1: { doNotConnect: true } }}
      />
      <capacitor
        name="C25"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={0.21}
        pcbY={-0.8}
        pcbRotation={180}
        pinAttributes={{ pin1: { doNotConnect: true } }}
      />
      <via
        name="GND_C15"
        pcbX={-1}
        pcbY={0.8}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter={0.45}
        holeDiameter={0.3}
        connectsTo="net.GND"
      />
      <via
        name="GND_C25"
        pcbX={-1}
        pcbY={-0.8}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter={0.45}
        holeDiameter={0.3}
        connectsTo="net.GND"
      />
      <trace from="C15.pin2" to="GND_C15.top" pcbStraightLine />
      <trace from="C25.pin2" to="GND_C25.top" pcbStraightLine />
      <pcbnotetext
        pcbY={2}
        fontSize={0.22}
        text="Top GND returns joined through vias on bottom"
      />
      <pcbnotetext
        pcbY={-2}
        fontSize={0.22}
        text="Expected: one GND group, no shorts"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const bottomTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) =>
      trace.route.some(
        (point) => point.route_type === "wire" && point.layer === "bottom",
      ),
    )
  expect(bottomTraces).toHaveLength(1)
  expect(bottomTraces[0].source_trace_id).toBeUndefined()

  const ground = circuit.db.source_net.list().find((net) => net.name === "GND")!
  const connectivityMap = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )
  expect(
    connectivityMap.areAllIdsConnected([
      ground.source_net_id,
      bottomTraces[0].pcb_trace_id,
      ...circuit.db.pcb_via.list().map((via) => via.pcb_via_id),
    ]),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
