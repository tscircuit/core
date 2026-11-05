import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("discarded imported vias must not connect pours on different layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled>
      <net name="GND" />
      <testpoint name="A" footprintVariant="pad" pcbX={-3} padDiameter={1} />
      <testpoint
        name="B"
        footprintVariant="pad"
        pcbX={3}
        padDiameter={1}
        layer="bottom"
      />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <via
        name="V1"
        pcbX={0}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.GND"
      />
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit
    .getCircuitJson()
    .map((element) =>
      element.type === "pcb_via"
        ? { ...element, subcircuit_id: undefined }
        : element,
    )
  const { simpleRouteJson: retained } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })
  const { simpleRouteJson: fresh } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  expect(retained.connections[0]!.externallyConnectedPointIds).toEqual([
    retained.connections[0]!.pointsToConnect.map((point) => point.pointId!),
  ])
  expect(fresh.connections[0]!.externallyConnectedPointIds).toBeUndefined()
})
