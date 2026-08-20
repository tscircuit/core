import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getAsymmetricConnectorFootprint = () => (
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
    <silkscreentext text="{NAME}" pcbY="2.5mm" fontSize="0.8mm" />
  </footprint>
)

test("J-prefixed components infer cable insertion centers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <chip
        name="J1"
        pcbX={-12}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getAsymmetricConnectorFootprint()}
      />
      <chip
        name="U1"
        pcbX={-4}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getAsymmetricConnectorFootprint()}
      />
      <connector
        name="P1"
        pcbX={4}
        pinLabels={{ pin1: ["1"], pin2: ["2"] }}
        footprint={getAsymmetricConnectorFootprint()}
      />
      <jumper
        name="JP1"
        pcbX={12}
        pinCount={2}
        footprint={getAsymmetricConnectorFootprint()}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const getPcbComponentByRefdes = (refdes: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((component) => component.name === refdes)
    return circuit.db.pcb_component
      .list()
      .find(
        (component) =>
          component.source_component_id ===
          sourceComponent?.source_component_id,
      )
  }

  const jChip = getPcbComponentByRefdes("J1")
  const uChip = getPcbComponentByRefdes("U1")
  const connector = getPcbComponentByRefdes("P1")
  const jumper = getPcbComponentByRefdes("JP1")

  expect(jChip?.cable_insertion_center).toBeDefined()
  expect(uChip?.cable_insertion_center).toBeUndefined()
  expect(connector?.cable_insertion_center).toBeDefined()
  expect(jumper?.cable_insertion_center).toBeDefined()

  const accessibleOrientationWarnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_connector_not_in_accessible_orientation_warning",
    )
  expect(
    accessibleOrientationWarnings.map((warning) => warning.pcb_component_id),
  ).toEqual([
    jChip!.pcb_component_id,
    connector!.pcb_component_id,
    jumper!.pcb_component_id,
  ])

  const circuitJson = await circuit.getCircuitJson()
  for (const [refdes, pcbComponent] of [
    ["J1", jChip],
    ["P1", connector],
    ["JP1", jumper],
  ] as const) {
    const cableInsertionCenter = pcbComponent?.cable_insertion_center
    if (!cableInsertionCenter) continue
    circuitJson.push({
      type: "pcb_note_rect",
      pcb_note_rect_id: `pcb_note_rect_cable_center_${refdes}`,
      center: cableInsertionCenter,
      width: 1,
      height: 1,
      layer: "top",
      stroke_width: 0.1,
      is_filled: false,
      has_stroke: true,
      is_stroke_dashed: true,
      color: "#00ffff",
      text: `${refdes} cable center`,
      pcb_component_id: pcbComponent?.pcb_component_id,
    })
  }

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
