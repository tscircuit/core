import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbNoteDimension } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Circuit JSON imports PCB note dimensions with geometry and styling", async () => {
  const { circuit } = getTestFixture()
  // Footprint-local points in mm: +X right, +Y top, +Z above, right-handed.
  // offset_direction is unitless and receives no translation.
  const dimension: PcbNoteDimension = {
    type: "pcb_note_dimension",
    pcb_note_dimension_id: "input_dimension",
    pcb_component_id: "input_component",
    from: { x: -3, y: 1 },
    to: { x: 3, y: 1 },
    text: "custom 6mm",
    offset_distance: 1.25,
    offset_direction: { x: 1, y: -1 },
    layer: "bottom",
    font: "tscircuit2024",
    font_size: 0.65,
    color: "#ffaa44",
    arrow_size: 0.4,
  }
  const automaticDimension: PcbNoteDimension = {
    type: "pcb_note_dimension",
    pcb_note_dimension_id: "input_automatic",
    from: { x: -2, y: 0 },
    to: { x: 2, y: 0 },
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.65,
    arrow_size: 0.4,
  }
  const inputBefore = JSON.stringify([dimension, automaticDimension])

  circuit.add(
    <board width={32} height={20} routingDisabled schematicDisabled>
      <pcbnotetext
        text="PCB note dimensions: native JSX and JSON import"
        pcbY={8}
        fontSize={0.7}
      />
      <pcbnotetext text="native JSX" pcbX={-8} pcbY={5} fontSize={0.65} />
      <pcbnotetext text="imported JSON" pcbX={8} pcbY={5} fontSize={0.65} />
      <chip
        name="U_NATIVE"
        pcbX={-8}
        footprint={
          <footprint>
            <pcbnotedimension
              from={{ x: -3, y: 1 }}
              to={{ x: 3, y: 1 }}
              text="custom 6mm"
              offset={1.25}
              offsetDirection={{ x: 1, y: -1 }}
              layer="bottom"
              font="tscircuit2024"
              fontSize={0.65}
              color="#ffaa44"
              arrowSize={0.4}
            />
          </footprint>
        }
      />
      {/* The legacy FootprintProp union omits dimensions; the inputs above
          are checked against the current Circuit JSON record type. */}
      <chip
        name="U_JSON"
        pcbX={8}
        footprint={[dimension] as unknown as FootprintProp}
      />
      <pcbnotetext
        text="Omitted text uses measured distance; omitted offset stays unset"
        pcbY={-4}
        fontSize={0.55}
      />
      <chip
        name="U_AUTOMATIC"
        pcbY={-6}
        footprint={[automaticDimension] as unknown as FootprintProp}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const dimensions = circuit.db.pcb_note_dimension.list()
  expect(dimensions).toHaveLength(3)
  const native = dimensions[0]
  const imported = dimensions[1]
  expect(imported).toMatchObject({
    from: { x: native.from.x + 16, y: native.from.y },
    to: { x: native.to.x + 16, y: native.to.y },
    text: native.text,
    offset_distance: native.offset_distance,
    offset_direction: native.offset_direction,
    layer: native.layer,
    font: native.font,
    font_size: native.font_size,
    color: native.color,
    arrow_size: native.arrow_size,
  })
  expect(imported.pcb_component_id).not.toBe("input_component")
  expect(imported.pcb_note_dimension_id).not.toBe(
    dimension.pcb_note_dimension_id,
  )
  expect(dimensions[2]).toMatchObject({
    from: { x: -2, y: -6 },
    to: { x: 2, y: -6 },
    text: "4mm",
    layer: "top",
  })
  expect(dimensions[2].offset_distance).toBeUndefined()
  expect(dimensions[2].offset_direction).toBeUndefined()
  expect(JSON.stringify([dimension, automaticDimension])).toBe(inputBefore)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
