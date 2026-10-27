import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbHoleCircularWithRectPad } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local points are in mm: +X right, +Y top, +Z above, right-handed.
// The pad's local X axis is a direction rotated counterclockwise by this angle.
// Keep chip rotation at zero to isolate the JSON-to-props conversion.
const cases = [35, 0, 90, 180, 270].flatMap((rotation, row) =>
  (["top", "bottom"] as const).map((layer, side) => ({
    rotation,
    layer,
    nativeX: side === 0 ? -24 : 10,
    importedX: side === 0 ? -10 : 24,
    y: 20 - row * 11,
    nativeName: `U_NATIVE_${side}_${row}`,
    importedName: `U_JSON_${side}_${row}`,
    footprint: [
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: `input_hole_${side}_${row}`,
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
        rect_ccw_rotation: rotation,
        layers: ["top", "bottom"],
      } satisfies PcbHoleCircularWithRectPad,
    ],
  })),
)

const comparisons: {
  native: PcbHoleCircularWithRectPad
  imported: PcbHoleCircularWithRectPad
}[] = []

beforeAll(async () => {
  const { circuit } = getTestFixture()
  const inputBefore = JSON.stringify(cases)
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
      {[-24, -10, 10, 24].map((x, column) => (
        <Fragment key={x}>
          <pcbnotetext
            text={
              ["top / JSX", "top / JSON", "bottom / JSX", "bottom / JSON"][
                column
              ]
            }
            pcbX={x}
            pcbY={26}
            fontSize={0.65}
          />
        </Fragment>
      ))}
      {cases.map((fixture) => (
        <Fragment key={fixture.nativeName}>
          {fixture.layer === "top" && (
            <pcbnotetext
              text={`${fixture.rotation}deg`}
              pcbX={-34}
              pcbY={fixture.y}
              fontSize={0.65}
            />
          )}
          <chip
            name={fixture.nativeName}
            layer={fixture.layer}
            pcbX={fixture.nativeX}
            pcbY={fixture.y}
            footprint={
              <footprint>
                <platedhole
                  shape="circular_hole_with_rect_pad"
                  holeDiameter={1}
                  rectPadWidth={6}
                  rectPadHeight={2}
                  pcbRotation={fixture.rotation}
                />
              </footprint>
            }
          />
          <chip
            name={fixture.importedName}
            layer={fixture.layer}
            pcbX={fixture.importedX}
            pcbY={fixture.y}
            // FootprintProp still uses the legacy soup union. The input above
            // is checked against the current Circuit JSON record type.
            footprint={fixture.footprint as unknown as FootprintProp}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_plated_hole
    .list()
    .filter(
      (pad): pad is PcbHoleCircularWithRectPad =>
        pad.shape === "circular_hole_with_rect_pad",
    )
  expect(pads).toHaveLength(cases.length * 2)
  for (const fixture of cases) {
    const findPad = (name: string) => {
      const source = circuit.db.source_component.getWhere({ name })!
      const pcb = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      return pads.find((pad) => pad.pcb_component_id === pcb.pcb_component_id)!
    }
    const native = findPad(fixture.nativeName)
    const imported = findPad(fixture.importedName)
    expect(imported).toMatchObject({
      x: fixture.importedX,
      y: fixture.y,
      hole_diameter: native.hole_diameter,
      rect_pad_width: native.rect_pad_width,
      rect_pad_height: native.rect_pad_height,
      layers: native.layers,
    })
    comparisons.push({ native, imported })
  }
  expect(comparisons[0].native.rect_ccw_rotation).toBeCloseTo(35)
  expect(JSON.stringify(cases)).toBe(inputBefore)

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
