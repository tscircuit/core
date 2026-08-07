import { expect, test } from "bun:test"
import { sel } from "lib"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ConnectionResultExplanation = ({
  expectedCount,
  actualCount,
}: {
  expectedCount: number
  actualCount: number
}) => {
  let result = "SUCCEEDED"
  if (actualCount !== expectedCount) result = "FAILED"

  return (
    <>
      <pcbnotetext
        pcbY={-5.5}
        fontSize={0.55}
        text="REPRO: netlabel connectivity with schematic rendering disabled"
      />
      <pcbnotetext
        pcbY={-6.5}
        fontSize={0.55}
        text={`${result}: expected ${expectedCount} connected pads, got ${actualCount}`}
      />
    </>
  )
}

test.failing(
  "netlabel-connected pad is included in SRJ when schematic rendering is disabled",
  async () => {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true

    circuit.add(
      <board width="20mm" height="16mm">
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

    await circuit.renderUntilSettled()

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
    const actualConnectedPadCount = connectedPortSelectors?.length ?? 0

    circuit.add(
      <ConnectionResultExplanation
        expectedCount={2}
        actualCount={actualConnectedPadCount}
      />,
    )
    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(connectedPortSelectors).toMatchInlineSnapshot(`
      [
        "R1.pin1",
      ]
    `)
    expect(connectedPortSelectors).toHaveLength(2)
  },
)
