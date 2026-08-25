import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getPotentialConnectorFootprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.75mm"
      pcbY="1mm"
      width="0.7mm"
      height="1.5mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="0.75mm"
      pcbY="1mm"
      width="0.7mm"
      height="1.5mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -2, y: -2 },
        { x: 2, y: -2 },
        { x: 2, y: 1.75 },
        { x: -2, y: 1.75 },
        { x: -2, y: -2 },
      ]}
    />
  </footprint>
)

test("J-prefixed chips are checked as potential connectors without adding connector metadata", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <chip
        name="J1"
        pcbX={-8}
        pcbY={8}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getPotentialConnectorFootprint()}
      />
      <chip
        name="J2"
        pcbX={0}
        pcbY={-8}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getPotentialConnectorFootprint()}
      />
      <chip
        name="U1"
        pcbX={8}
        pcbY={8}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getPotentialConnectorFootprint()}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getPcbComponentByRefdes = (refdes: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: refdes,
    })
    return circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent?.source_component_id,
    })
  }

  const j1 = getPcbComponentByRefdes("J1")
  const j2 = getPcbComponentByRefdes("J2")
  const u1 = getPcbComponentByRefdes("U1")
  const orientationWarnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_connector_not_in_accessible_orientation_warning",
    )

  expect(j1?.cable_insertion_center).toBeUndefined()
  expect(j2?.cable_insertion_center).toBeUndefined()
  expect(u1?.cable_insertion_center).toBeUndefined()
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(orientationWarnings).toHaveLength(1)
  expect(orientationWarnings[0]).toMatchObject({
    pcb_component_id: j1?.pcb_component_id,
    source_component_id: j1?.source_component_id,
    facing_direction: "y-",
    recommended_facing_direction: "y+",
  })
})
