import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { SimpleRoutePoint } from "lib/utils/autorouting/SimpleRouteJson"

test("simple route json points include semantic port selectors", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "USB_DM", pin8: "GND" }}
        pcbX={-2}
      />
      <resistor name="R1" resistance="22" footprint="0402" pcbX={2} />
      <net name="USB_DN" />
      <trace from="U1.USB_DM" to="net.USB_DN" />
      <trace from="R1.pin1" to="net.USB_DN" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })

  const points = simpleRouteJson.connections.flatMap(
    (connection) => connection.pointsToConnect,
  )

  expect(points.map((point) => point.port_selector)).toContain("U1.USB_DM")
  expect(points.map((point) => point.port_selector)).toContain("R1.pin1")

  const typedPoint: SimpleRoutePoint = points[0]!
  expect(typedPoint.port_selector).toBeDefined()
})
