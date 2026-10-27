import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbNoteDimension,
  PcbFabricationNoteDimension,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported dimension endpoints and offset directions follow footprint placement", async () => {
  const { circuit } = getTestFixture()
  // Footprint-local points in mm: +X right, +Y top, +Z above, right-handed.
  // Three pads mark from, to, and from + the unitless offset direction.
  // Compare emitted geometry so an offset translated as a point cannot pass.
  const footprint = [
    {
      type: "pcb_note_dimension",
      pcb_note_dimension_id: "input_note",
      pcb_component_id: "input_component",
      from: { x: -2, y: 1 },
      to: { x: 2, y: 1 },
      text: "PCB note",
      offset_distance: 1,
      offset_direction: { x: 0.6, y: -0.8 },
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.5,
      color: "#66bbff",
      arrow_size: 0.3,
    } satisfies PcbNoteDimension,
    {
      type: "pcb_fabrication_note_dimension",
      pcb_fabrication_note_dimension_id: "input_fabrication",
      pcb_component_id: "input_component",
      from: { x: -2, y: 1 },
      to: { x: 2, y: 1 },
      text: "Fabrication",
      offset_distance: 3,
      offset_direction: { x: 0.6, y: -0.8 },
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.5,
      color: "#ffaa44",
      arrow_size: 0.3,
    } satisfies PcbFabricationNoteDimension,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "input_from",
      pcb_component_id: "input_component",
      shape: "circle",
      x: -2,
      y: 1,
      radius: 0.15,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "input_to",
      pcb_component_id: "input_component",
      shape: "circle",
      x: 2,
      y: 1,
      radius: 0.15,
      layer: "top",
      port_hints: ["2"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "input_direction",
      pcb_component_id: "input_component",
      shape: "circle",
      x: -1.4,
      y: 0.2,
      radius: 0.15,
      layer: "top",
      port_hints: ["3"],
    },
  ] satisfies AnyCircuitElement[]
  const inputBefore = JSON.stringify(footprint)

  circuit.add(
    <board width={100} height={50} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Imported dimensions follow footprint rotation and mirroring"
        pcbY={23}
        fontSize={1}
      />
      <pcbnotetext
        text="Pads mark endpoints and offset direction; blue: PCB note, orange: fabrication"
        pcbY={20}
        fontSize={0.7}
      />
      {/* The legacy FootprintProp union omits dimensions; footprint above is
          checked against the current Circuit JSON record types. */}
      <pcbnotetext text="top 0deg" pcbX={-36} pcbY={16} fontSize={0.75} />
      <chip
        name="U_TOP_0"
        layer="top"
        pcbX={-36}
        pcbY={10}
        pcbRotation={0}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="top 90deg" pcbX={-12} pcbY={16} fontSize={0.75} />
      <chip
        name="U_TOP_90"
        layer="top"
        pcbX={-12}
        pcbY={10}
        pcbRotation={90}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="top 180deg" pcbX={12} pcbY={16} fontSize={0.75} />
      <chip
        name="U_TOP_180"
        layer="top"
        pcbX={12}
        pcbY={10}
        pcbRotation={180}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="top 270deg" pcbX={36} pcbY={16} fontSize={0.75} />
      <chip
        name="U_TOP_270"
        layer="top"
        pcbX={36}
        pcbY={10}
        pcbRotation={270}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="bottom 0deg" pcbX={-36} pcbY={-4} fontSize={0.75} />
      <chip
        name="U_BOTTOM_0"
        layer="bottom"
        pcbX={-36}
        pcbY={-10}
        pcbRotation={0}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="bottom 90deg" pcbX={-12} pcbY={-4} fontSize={0.75} />
      <chip
        name="U_BOTTOM_90"
        layer="bottom"
        pcbX={-12}
        pcbY={-10}
        pcbRotation={90}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="bottom 180deg" pcbX={12} pcbY={-4} fontSize={0.75} />
      <chip
        name="U_BOTTOM_180"
        layer="bottom"
        pcbX={12}
        pcbY={-10}
        pcbRotation={180}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext text="bottom 270deg" pcbX={36} pcbY={-4} fontSize={0.75} />
      <chip
        name="U_BOTTOM_270"
        layer="bottom"
        pcbX={36}
        pcbY={-10}
        pcbRotation={270}
        footprint={footprint as unknown as FootprintProp}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const notes = circuit.db.pcb_note_dimension.list()
  const fabricationNotes = circuit.db.pcb_fabrication_note_dimension.list()
  expect(notes).toHaveLength(8)
  expect(fabricationNotes).toHaveLength(8)
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "circle")
  for (const dimension of [...notes, ...fabricationNotes]) {
    const fromPad = pads.find(
      (pad) =>
        pad.pcb_component_id === dimension.pcb_component_id &&
        pad.port_hints?.includes("1"),
    )!
    const toPad = pads.find(
      (pad) =>
        pad.pcb_component_id === dimension.pcb_component_id &&
        pad.port_hints?.includes("2"),
    )!
    const directionPad = pads.find(
      (pad) =>
        pad.pcb_component_id === dimension.pcb_component_id &&
        pad.port_hints?.includes("3"),
    )!
    expect(dimension.from.x).toBeCloseTo(fromPad.x, 6)
    expect(dimension.from.y).toBeCloseTo(fromPad.y, 6)
    expect(dimension.to.x).toBeCloseTo(toPad.x, 6)
    expect(dimension.to.y).toBeCloseTo(toPad.y, 6)
    expect(dimension.offset_direction?.x).toBeCloseTo(
      directionPad.x - fromPad.x,
      6,
    )
    expect(dimension.offset_direction?.y).toBeCloseTo(
      directionPad.y - fromPad.y,
      6,
    )
    const pcb = circuit.db.pcb_component.get(dimension.pcb_component_id!)!
    if (dimension.type === "pcb_fabrication_note_dimension") {
      expect(pcb.layer).toBe(dimension.layer)
      expect(dimension.offset_distance).toBe(3)
    } else {
      // PCB notes retain their explicit annotation layer, matching native JSX.
      expect(dimension.layer).toBe("top")
      expect(dimension.offset_distance).toBe(1)
    }
  }
  expect(JSON.stringify(footprint)).toBe(inputBefore)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
