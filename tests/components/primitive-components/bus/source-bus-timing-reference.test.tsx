import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keeps a selected clock path separate from its termination branch", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={16} routingDisabled schematicDisabled>
      <chip name="U1" footprint="soic8" pcbX={-8} />
      <chip name="U2" footprint="soic8" pcbX={6} />
      <resistor name="RT" footprint="0402" resistance="100" pcbY={6} />
      <trace name="CK" from="U1.pin1" to="U2.pin1" />
      <trace name="CK_TERM" from="U2.pin1" to="RT.pin1" />
      <trace name="D0" from="U1.pin2" to="U2.pin2" />
      <trace name="D1" from="U1.pin3" to="U2.pin3" />
      <bus
        name="CLOCK"
        connections={["CK"]}
        lengthMatchingPaths={[["U1.pin1", "U2.pin1"]]}
      />
      <bus
        name="DATA"
        connections={["D0", "D1"]}
        maxLengthSkew={0.5}
        skewReference="references"
        lengthMatchTo=".CLOCK"
      />
    </board>,
  )
  circuit.render()

  const clock = circuit.db.source_trace.getWhere({ name: "CK" })!
  const clockBus = circuit.db.source_bus.getWhere({ name: "CLOCK" })!
  const dataBus = circuit.db.source_bus.getWhere({ name: "DATA" })!
  expect(clockBus.length_matching_paths).toEqual([
    {
      source_trace_id: clock.source_trace_id,
      source_port_ids: clock.connected_source_port_ids,
    },
  ])
  expect(dataBus).toMatchObject({
    skew_reference: "references",
    max_length_skew: 0.5,
    length_match_source_trace_ids: [clock.source_trace_id],
  })

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const clockSrjBus = simpleRouteJson.buses!.find(
    (bus) => bus.name === "CLOCK",
  )!
  const dataSrjBus = simpleRouteJson.buses!.find((bus) => bus.name === "DATA")!
  expect(dataSrjBus.referenceConnectionNames).toEqual(
    clockSrjBus.connectionNames,
  )
  expect(dataSrjBus.skewReference).toBe("references")
  expect(clockSrjBus.lengthMatchingPaths).toHaveLength(1)
  expect(clockSrjBus.lengthMatchingPaths![0].pcbPortIds).toEqual([
    circuit.db.pcb_port.getWhere({
      source_port_id: clock.connected_source_port_ids[0],
    })!.pcb_port_id,
    circuit.db.pcb_port.getWhere({
      source_port_id: clock.connected_source_port_ids[1],
    })!.pcb_port_id,
  ])
})
