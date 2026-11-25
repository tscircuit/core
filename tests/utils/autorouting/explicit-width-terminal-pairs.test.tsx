import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exports the width and terminal order of traces on a shared net", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12} routingDisabled schematicDisabled>
      <pinheader name="A" pinCount={1} pcbX={-5} />
      <pinheader name="B" pinCount={1} pcbX={5} />
      <pinheader name="C" pinCount={1} pcbY={2} />
      <pinheader name="D" pinCount={1} pcbY={4} />
      <net name="VCC" nominalTraceWidth={0.2} />
      <trace name="supply" from="A.pin1" to="B.pin1" width={0.8} />
      <trace name="sense" from="B.pin1" to="C.pin1" width={0.25} />
      <trace from="C.pin1" to="net.VCC" />
      <trace from="D.pin1" to="net.VCC" />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const saved = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  }).simpleRouteJson
  expect(saved.connections).toEqual(simpleRouteJson.connections)

  const requests = simpleRouteJson.connections.map((connection) => {
    const ports = connection.pointsToConnect
    const path = connection.path
      ?.map((id) => ports.find((port) => port.pointId === id)!.port_selector)
      .join(" → ")
    const terminals = ports.map((port) => port.port_selector).join(", ")
    return `${path ?? `automatic (${terminals})`} · ${connection.nominalTraceWidth} mm`
  })
  expect(requests).toMatchInlineSnapshot(`
    [
      "automatic (A.pin1, B.pin1) · 0.8 mm",
      "automatic (B.pin1, C.pin1) · 0.25 mm",
      "automatic (A.pin1, B.pin1, C.pin1, D.pin1) · 0.8 mm",
    ]
  `)
})
