import { expect, test } from "bun:test"
import { sel } from "lib"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PropsWithChildren } from "react"

const NetlabelReproBoard = ({ children }: PropsWithChildren) => (
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
    {children}
  </board>
)

const RouteResultExplanation = ({
  expectedRouteCount,
  actualRouteCount,
}: {
  expectedRouteCount: number
  actualRouteCount: number
}) => {
  let result = "SUCCEEDED"
  if (actualRouteCount !== expectedRouteCount) result = "FAILED"

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
        text={`${result}: expected ${expectedRouteCount} routed trace, got ${actualRouteCount}`}
      />
    </>
  )
}

test("netlabel-connected pad is included in SRJ when schematic rendering is disabled", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true

  circuit.add(<NetlabelReproBoard />)

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((element) => element.type !== "pcb_trace"),
  })
  const sdaConnection = simpleRouteJson.connections.find((connection) =>
    connection.pointsToConnect.some(
      (point) => point.port_selector === "R1.pin1",
    ),
  )
  const connectedPortSelectors = sdaConnection?.pointsToConnect.map(
    (point) => point.port_selector,
  )
  const actualRouteCount = circuit.db.pcb_trace.list().length

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.schematicDisabled = true
  snapshotCircuit.add(
    <NetlabelReproBoard>
      <RouteResultExplanation
        expectedRouteCount={1}
        actualRouteCount={actualRouteCount}
      />
    </NetlabelReproBoard>,
  )
  await snapshotCircuit.renderUntilSettled()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(connectedPortSelectors).toMatchInlineSnapshot(`
      [
        "R1.pin1",
        "R2.pin1",
      ]
    `)
  expect(actualRouteCount).toBe(1)
})
