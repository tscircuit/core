import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbSilkscreenRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local centers are points in mm (+X right, +Y top, +Z above,
// right-handed); rectangle axes are directions with a local CCW rotation.
// Imported chip rotation stays zero to isolate the JSON-to-props conversion.
const importedFootprints = {
  top35: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_0_0",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 35,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  bottom35: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_1_0",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 35,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  top0: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_0_1",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 0,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  bottom0: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_1_1",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 0,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  top90: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_0_2",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 90,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  bottom90: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_1_2",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 90,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  top180: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_0_3",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 180,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  bottom180: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_1_3",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 180,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  top270: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_0_4",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 270,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
  bottom270: [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "input_rect_1_4",
      pcb_component_id: "input_component",
      center: {
        x: 0,
        y: 0,
      },
      width: 6,
      height: 2,
      ccw_rotation: 270,
      layer: "top",
      stroke_width: 0.15,
    },
  ],
} satisfies Record<string, PcbSilkscreenRect[]>

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
  native: PcbSilkscreenRect
  imported: PcbSilkscreenRect
}[] = []

beforeAll(async () => {
  const { circuit } = getTestFixture()
  const inputBefore = JSON.stringify(importedFootprints)
  circuit.add(
    <board width={78} height={76} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Silkscreen rectangle: JSON rotation import"
        pcbY={34}
        fontSize={0.9}
      />
      <pcbnotetext
        text="Each JSON rectangle should match its native JSX neighbor"
        pcbY={30}
        fontSize={0.7}
      />
      <pcbnotetext text="top / JSX" pcbX={-24} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="top / JSON" pcbX={-10} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="bottom / JSX" pcbX={10} pcbY={26} fontSize={0.65} />
      <pcbnotetext text="bottom / JSON" pcbX={24} pcbY={26} fontSize={0.65} />
      {/* FootprintProp uses the legacy soup union. importedFootprints above
          is checked against the current Circuit JSON record type. */}
      {/* Native SilkscreenRect rotates through its parent. On the bottom,
          F R(theta) = R(-theta) F: use a negative parent rotation to match
          the JSON footprint-local rotation before mirroring, following
          PrimitiveComponent._computePcbGlobalTransformBeforeLayout. */}
      <pcbnotetext text="35deg" pcbX={-34} pcbY={20} fontSize={0.65} />
      <chip
        name="U_NATIVE_0_0"
        layer="top"
        pcbX={-24}
        pcbY={20}
        pcbRotation={35}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={-35}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={0}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={0}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={90}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={-90}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={180}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={-180}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={270}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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
        pcbRotation={-270}
        footprint={
          <footprint>
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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

  const rects = circuit.db.pcb_silkscreen_rect.list()
  expect(rects).toHaveLength(placements.length * 2)
  for (const placement of placements) {
    const findRect = (name: string) => {
      const source = circuit.db.source_component.getWhere({ name })!
      const pcb = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      return rects.find(
        (rect) => rect.pcb_component_id === pcb.pcb_component_id,
      )!
    }
    const native = findRect(placement.nativeName)
    const imported = findRect(placement.importedName)
    expect(imported).toMatchObject({
      center: { x: placement.importedX, y: placement.y },
      layer: native.layer,
      stroke_width: native.stroke_width,
    })
    // Axis-aligned rotations may swap width/height instead of storing 90deg.
    // Only check the unordered dimensions here; their orientation belongs in
    // the expected-failure assertion below.
    expect([imported.width, imported.height].sort()).toEqual([2, 6])
    comparisons.push({ native, imported })
  }
  expect(comparisons[0].native.ccw_rotation).toBeCloseTo(35)
  expect(JSON.stringify(importedFootprints)).toBe(inputBefore)

  // Snapshot failures must fail CI, independently of the known import bug.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing("Circuit JSON preserves silkscreen rectangle rotation", () => {
  // Current bug: 35deg becomes 0deg. Remove .failing and update the snapshot
  // when the importer forwards ccw_rotation; the desired assertion stays.
  for (const { native, imported } of comparisons) {
    expect(imported.width).toBeCloseTo(native.width)
    expect(imported.height).toBeCloseTo(native.height)
    expect(imported.ccw_rotation).toBeCloseTo(native.ccw_rotation!)
  }
})
