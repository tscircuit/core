import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("interconnect with custom footprint and internallyConnectedPins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" autorouter="laser_prefab">
      <testpoint name="TP_LEFT" pcbX={-5} pcbY={0} />
      <testpoint name="TP_RIGHT" pcbX={5} pcbY={0} />

      <silkscreentext
        text="This interconnect has a custom footprint with internallyConnectedPins"
        pcbX={0}
        pcbY={2}
        fontSize="0.2mm"
      />
      <interconnect
        name="IC1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX={-1}
              pcbY={0}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX={1}
              pcbY={0}
              portHints={["pin2"]}
            />
          </footprint>
        }
        internallyConnectedPins={[["pin1", "pin2"]]}
        pcbX={0}
        pcbY={0}
      />
      <cutout pcbX={0} pcbY={0} shape="rect" width={0.25} height={8} />

      <trace from="TP_LEFT.pin1" to="TP_RIGHT.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify internal connections in DB
  const internalConnections =
    circuit.db.source_component_internal_connection.list()

  // We expect one internal connection for the interconnect
  const icConnection = internalConnections.find((conn) => {
    const sourceComponent = circuit.db.source_component.get(
      conn.source_component_id,
    )
    return sourceComponent?.name === "IC1"
  })

  expect(icConnection).toBeDefined()
  expect(icConnection?.source_port_ids).toHaveLength(2)

  // Verify that we can route through it (implicitly tested by renderUntilSettled failing if routing fails,
  // but we can also check for connectivity or just snapshot)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
