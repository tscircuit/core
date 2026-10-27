import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbHoleCircularWithRectPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points are in mm: +X right, +Y top, +Z above, right-handed.
// The pad's local X axis is a direction rotated counterclockwise by this angle.
// Keep chip rotation at zero to isolate the JSON-to-props conversion.
const importedFootprints = {
  top35: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_0_0",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 35,
      layers: ["top", "bottom"],
    },
  ],
  bottom35: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_1_0",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 35,
      layers: ["top", "bottom"],
    },
  ],
  top0: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_0_1",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 0,
      layers: ["top", "bottom"],
    },
  ],
  bottom0: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_1_1",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 0,
      layers: ["top", "bottom"],
    },
  ],
  top90: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_0_2",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 90,
      layers: ["top", "bottom"],
    },
  ],
  bottom90: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_1_2",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 90,
      layers: ["top", "bottom"],
    },
  ],
  top180: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_0_3",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 180,
      layers: ["top", "bottom"],
    },
  ],
  bottom180: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_1_3",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 180,
      layers: ["top", "bottom"],
    },
  ],
  top270: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_0_4",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 270,
      layers: ["top", "bottom"],
    },
  ],
  bottom270: [
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "input_hole_1_4",
      pcb_component_id: "input_component",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 0,
      y: 0,
      hole_diameter: 1,
      rect_pad_width: 6,
      rect_pad_height: 2,
      rect_ccw_rotation: 270,
      layers: ["top", "bottom"],
    },
  ],
} satisfies Record<string, PcbHoleCircularWithRectPad[]>

const placements = [
  {
    nativeName: "U_NATIVE_0_0",
    importedName: "U_JSON_0_0",
    importedX: -10,
    y: 20,
  },
  {
    nativeName: "U_NATIVE_1_0",
    importedName: "U_JSON_1_0",
    importedX: 24,
    y: 20,
  },
  {
    nativeName: "U_NATIVE_0_1",
    importedName: "U_JSON_0_1",
    importedX: -10,
    y: 9,
  },
  {
    nativeName: "U_NATIVE_1_1",
    importedName: "U_JSON_1_1",
    importedX: 24,
    y: 9,
  },
  {
    nativeName: "U_NATIVE_0_2",
    importedName: "U_JSON_0_2",
    importedX: -10,
    y: -2,
  },
  {
    nativeName: "U_NATIVE_1_2",
    importedName: "U_JSON_1_2",
    importedX: 24,
    y: -2,
  },
  {
    nativeName: "U_NATIVE_0_3",
    importedName: "U_JSON_0_3",
    importedX: -10,
    y: -13,
  },
  {
    nativeName: "U_NATIVE_1_3",
    importedName: "U_JSON_1_3",
    importedX: 24,
    y: -13,
  },
  {
    nativeName: "U_NATIVE_0_4",
    importedName: "U_JSON_0_4",
    importedX: -10,
    y: -24,
  },
  {
    nativeName: "U_NATIVE_1_4",
    importedName: "U_JSON_1_4",
    importedX: 24,
    y: -24,
  },
]

const comparisons: {
  native: PcbHoleCircularWithRectPad
  imported: PcbHoleCircularWithRectPad
}[] = []

beforeAll(async () => {
  const { circuit } = getTestFixture()
  const inputBefore = JSON.stringify(importedFootprints)
  circuit.add(
    <board width={78} height={76} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Circular hole / rectangular pad: JSON rotation import"
        pcbY={34}
        fontSize={0.9}
      />
      <pcbnotetext
        text="Each JSON pad should match its native JSX neighbor"
        pcbY={30}
        fontSize={0.7}
      />
      <pcbnotetext text="top / JSX" pcbX={-24} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="top / JSON" pcbX={-10} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="bottom / JSX" pcbX={10} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="bottom / JSON" pcbX={24} pcbY={26} fontSize={0.65} />
      {/* FootprintProp uses the legacy soup union. importedFootprints above
          is checked against the current Circuit JSON record type. */}
      <pcbnotetext text="35deg" pcbX={-34} pcbY={20} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_0"
        layer="top"
        pcbX={-24}
        pcbY={20}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={35}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_0_0"
        layer="top"
        pcbX={-10}
        pcbY={20}
        footprint={importedFootprints.top35 as unknown as FootprintProp}
      />
      <chip
        name="U_NATIVE_1_0"
        layer="bottom"
        pcbX={10}
        pcbY={20}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={35}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_1_0"
        layer="bottom"
        pcbX={24}
        pcbY={20}
        footprint={importedFootprints.bottom35 as unknown as FootprintProp}
      />
      <pcbnotetext text="0deg" pcbX={-34} pcbY={9} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_1"
        layer="top"
        pcbX={-24}
        pcbY={9}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_0_1"
        layer="top"
        pcbX={-10}
        pcbY={9}
        footprint={importedFootprints.top0 as unknown as FootprintProp}
      />
      <chip
        name="U_NATIVE_1_1"
        layer="bottom"
        pcbX={10}
        pcbY={9}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_1_1"
        layer="bottom"
        pcbX={24}
        pcbY={9}
        footprint={importedFootprints.bottom0 as unknown as FootprintProp}
      />
      <pcbnotetext text="90deg" pcbX={-34} pcbY={-2} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_2"
        layer="top"
        pcbX={-24}
        pcbY={-2}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_0_2"
        layer="top"
        pcbX={-10}
        pcbY={-2}
        footprint={importedFootprints.top90 as unknown as FootprintProp}
      />
      <chip
        name="U_NATIVE_1_2"
        layer="bottom"
        pcbX={10}
        pcbY={-2}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_1_2"
        layer="bottom"
        pcbX={24}
        pcbY={-2}
        footprint={importedFootprints.bottom90 as unknown as FootprintProp}
      />
      <pcbnotetext text="180deg" pcbX={-34} pcbY={-13} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_3"
        layer="top"
        pcbX={-24}
        pcbY={-13}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_0_3"
        layer="top"
        pcbX={-10}
        pcbY={-13}
        footprint={importedFootprints.top180 as unknown as FootprintProp}
      />
      <chip
        name="U_NATIVE_1_3"
        layer="bottom"
        pcbX={10}
        pcbY={-13}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_1_3"
        layer="bottom"
        pcbX={24}
        pcbY={-13}
        footprint={importedFootprints.bottom180 as unknown as FootprintProp}
      />
      <pcbnotetext text="270deg" pcbX={-34} pcbY={-24} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_4"
        layer="top"
        pcbX={-24}
        pcbY={-24}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_0_4"
        layer="top"
        pcbX={-10}
        pcbY={-24}
        footprint={importedFootprints.top270 as unknown as FootprintProp}
      />
      <chip
        name="U_NATIVE_1_4"
        layer="bottom"
        pcbX={10}
        pcbY={-24}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={6}
              rectPadHeight={2}
              pcbRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name="U_JSON_1_4"
        layer="bottom"
        pcbX={24}
        pcbY={-24}
        footprint={importedFootprints.bottom270 as unknown as FootprintProp}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_plated_hole
    .list()
    .filter(
      (pad): pad is PcbHoleCircularWithRectPad =>
        pad.shape === "circular_hole_with_rect_pad",
    )
  expect(pads).toHaveLength(placements.length * 2)
  for (const placement of placements) {
    const findPad = (name: string) => {
      const source = circuit.db.source_component.getWhere({ name })!
      const pcb = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      return pads.find((pad) => pad.pcb_component_id === pcb.pcb_component_id)!
    }
    const native = findPad(placement.nativeName)
    const imported = findPad(placement.importedName)
    expect(imported).toMatchObject({
      x: placement.importedX,
      y: placement.y,
      hole_diameter: native.hole_diameter,
      rect_pad_width: native.rect_pad_width,
      rect_pad_height: native.rect_pad_height,
      layers: native.layers,
    })
    comparisons.push({ native, imported })
  }
  expect(comparisons[0].native.rect_ccw_rotation).toBeCloseTo(35)
  expect(JSON.stringify(importedFootprints)).toBe(inputBefore)

  // Keep setup and snapshot errors outside test.failing: only the missing
  // rotation preservation below is an expected failure in this repro PR.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing(
  "Circuit JSON preserves circular-hole rectangular-pad rotation",
  () => {
    // Current bug: 35deg becomes 0deg. After fixing the importer, remove .failing
    // and update the snapshot; retain this assertion of the desired behavior.
    for (const { native, imported } of comparisons) {
      expect(imported.rect_ccw_rotation).toBeCloseTo(native.rect_ccw_rotation!)
    }
  },
)
