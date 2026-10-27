import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbFabricationNoteDimension } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Circuit JSON imports fabrication dimensions and resolves legacy offsets", async () => {
  const { circuit } = getTestFixture()
  // Footprint-local points in mm: +X right, +Y top, +Z above, right-handed.
  // offset_direction is a unitless direction, not a translated point.
  const dimension: PcbFabricationNoteDimension = {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: "input_dimension",
    pcb_component_id: "input_component",
    from: { x: -3, y: 0 },
    to: { x: 3, y: 0 },
    text: "custom 6mm",
    offset: 9,
    offset_distance: 1.5,
    offset_direction: { x: 1, y: -1 },
    layer: "bottom",
    font: "tscircuit2024",
    font_size: 0.65,
    color: "#ffaa44",
    arrow_size: 0.4,
  }
  const legacyDimension: PcbFabricationNoteDimension = {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: "input_legacy",
    pcb_component_id: "input_component",
    from: { x: -3, y: 0 },
    to: { x: 3, y: 0 },
    text: "legacy offset",
    offset: 0.75,
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.65,
    arrow_size: 0.4,
  }
  const zeroDimension: PcbFabricationNoteDimension = {
    ...legacyDimension,
    pcb_fabrication_note_dimension_id: "input_zero",
    text: "",
    offset: 9,
    offset_distance: 0,
  }
  const automaticDimension: PcbFabricationNoteDimension = {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: "input_automatic",
    pcb_component_id: "input_component",
    from: { x: -2, y: 0 },
    to: { x: 2, y: 0 },
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.65,
    arrow_size: 0.4,
  }
  const inputs = [dimension, legacyDimension, zeroDimension, automaticDimension]
  const inputBefore = JSON.stringify(inputs)

  circuit.add(
    <board width={34} height={28} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Fabrication dimensions: native JSX and JSON import"
        pcbY={12}
        fontSize={0.7}
      />
      <pcbnotetext text="native JSX" pcbX={-8} pcbY={9} fontSize={0.65} />
      <pcbnotetext
        text="JSON: offset_distance wins"
        pcbX={8}
        pcbY={9}
        fontSize={0.55}
      />
      <chip
        name="U_NATIVE"
        pcbX={-8}
        pcbY={6}
        footprint={
          <footprint>
            <fabricationnotedimension
              from={{ x: -3, y: 0 }}
              to={{ x: 3, y: 0 }}
              text="custom 6mm"
              offset={1.5}
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
      {/* The legacy FootprintProp union omits dimensions; inputs above use
          the current Circuit JSON record type. */}
      <chip
        name="U_JSON"
        pcbX={8}
        pcbY={6}
        footprint={[dimension] as unknown as FootprintProp}
      />
      <pcbnotetext
        text="Legacy offset fallback"
        pcbX={-8}
        pcbY={1}
        fontSize={0.6}
      />
      <chip
        name="U_LEGACY"
        pcbX={-8}
        pcbY={-2}
        footprint={[legacyDimension] as unknown as FootprintProp}
      />
      <pcbnotetext
        text="Explicit zero / empty text"
        pcbX={8}
        pcbY={1}
        fontSize={0.6}
      />
      <chip
        name="U_ZERO"
        pcbX={8}
        pcbY={-2}
        footprint={[zeroDimension] as unknown as FootprintProp}
      />
      <pcbnotetext
        text="Omitted text and offset: measured distance"
        pcbY={-7}
        fontSize={0.6}
      />
      <chip
        name="U_AUTOMATIC"
        pcbY={-10}
        footprint={[automaticDimension] as unknown as FootprintProp}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const dimensions = circuit.db.pcb_fabrication_note_dimension.list()
  expect(dimensions).toHaveLength(5)
  const native = dimensions[0]
  const imported = dimensions[1]
  expect(imported).toMatchObject({
    from: { x: native.from.x + 16, y: native.from.y },
    to: { x: native.to.x + 16, y: native.to.y },
    text: native.text,
    offset: 1.5,
    offset_distance: native.offset_distance,
    offset_direction: native.offset_direction,
    layer: native.layer,
    font: native.font,
    font_size: native.font_size,
    color: native.color,
    arrow_size: native.arrow_size,
  })
  expect(imported.pcb_component_id).not.toBe("input_component")
  expect(imported.pcb_fabrication_note_dimension_id).not.toBe(
    dimension.pcb_fabrication_note_dimension_id,
  )
  expect(dimensions[2]).toMatchObject({
    text: "legacy offset",
    offset: 0.75,
    offset_distance: 0.75,
    offset_direction: { x: -0, y: 1 },
    layer: "top",
  })
  expect(dimensions[3]).toMatchObject({
    text: "",
    offset: 0,
    offset_distance: 0,
  })
  expect(dimensions[4]).toMatchObject({ text: "4mm", layer: "top" })
  expect(dimensions[4].offset_distance).toBeUndefined()
  expect(dimensions[4].offset_direction).toBeUndefined()
  expect(JSON.stringify(inputs)).toBe(inputBefore)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
