import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const footprint = (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX={0}
      pcbY={1.5}
      width={0.6}
      height={1}
      shape="rect"
    />
    <platedhole
      portHints={["pin2"]}
      pcbX={-2}
      pcbY={-1.5}
      shape="circle"
      holeDiameter={0.8}
      outerDiameter={1.4}
    />
    <platedhole
      portHints={["pin2"]}
      pcbX={2}
      pcbY={-1.5}
      shape="circle"
      holeDiameter={0.8}
      outerDiameter={1.4}
    />
  </footprint>
)

test("multi-pad pins retained by either arrangement or labels keep their PCB connections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={14} routingDisabled>
      <chip
        name="ARRANGED"
        pcbX={-6}
        footprint={footprint}
        pinLabels={{ pin1: "SIG" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG", "pin2"] },
        }}
      />
      <chip
        name="NAMED"
        pcbX={6}
        footprint={footprint}
        pinLabels={{ pin1: "SIG", pin2: "SHELL" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG"] },
        }}
      />
      <trace from="ARRANGED.pin2" to="net.GND" />
      <trace from="NAMED.SHELL" to="net.GND" />
      <pcbnotetext
        text="Both retained pins must keep two connected pad ports"
        pcbY={5.5}
        fontSize={0.5}
      />
      <pcbnotetext text="ARRANGED" pcbX={-6} pcbY={3.5} fontSize={0.6} />
      <pcbnotetext
        text="pin2 in arrangement"
        pcbX={-6}
        pcbY={-4}
        fontSize={0.5}
      />
      <pcbnotetext text="NAMED" pcbX={6} pcbY={3.5} fontSize={0.6} />
      <pcbnotetext
        text="SHELL in pinLabels"
        pcbX={6}
        pcbY={-4}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])
  expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
  expect(circuit.db.source_ambiguous_port_reference.list()).toEqual([])
  for (const name of ["ARRANGED", "NAMED"]) {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const holes = circuit.db.pcb_plated_hole
      .list()
      .filter((hole) => hole.pcb_component_id === pcbComponent.pcb_component_id)
    expect(holes.filter((hole) => hole.pcb_port_id)).toHaveLength(2)
    expect(new Set(holes.map((hole) => hole.pcb_port_id)).size).toBe(2)
    const sourcePortIds = holes.map(
      (hole) => circuit.db.pcb_port.get(hole.pcb_port_id!)!.source_port_id,
    )
    const internalConnection = circuit.db.source_component_internal_connection
      .list()
      .find((connection) =>
        connection.source_port_ids.includes(sourcePortIds[0]!),
      )
    expect(internalConnection?.source_port_ids.toSorted()).toEqual(
      sourcePortIds.toSorted(),
    )
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
