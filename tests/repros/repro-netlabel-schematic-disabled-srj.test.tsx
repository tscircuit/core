import { expect, test } from "bun:test"
import { sel } from "lib"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "netlabel-connected pad is included in SRJ when schematic rendering is disabled",
  () => {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true

    circuit.add(
      <board width="20mm" height="10mm" routingDisabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={-3}
          connections={{ pin1: sel.net.SDA }}
        />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={3} />
        <netlabel net="SDA" connection="R2.pin1" />
      </board>,
    )

    circuit.render()

    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
    })
    const sdaConnection = simpleRouteJson.connections.find((connection) =>
      connection.pointsToConnect.some(
        (point) => point.port_selector === "R1.pin1",
      ),
    )
    const connectedPortSelectors = sdaConnection?.pointsToConnect.map(
      (point) => point.port_selector,
    )

    expect(connectedPortSelectors).toMatchInlineSnapshot(`
      [
        "R1.pin1",
      ]
    `)
    expect(connectedPortSelectors).toHaveLength(2)
  },
)
