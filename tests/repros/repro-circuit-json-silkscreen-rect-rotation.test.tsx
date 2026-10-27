import { beforeAll, expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import type { PcbSilkscreenRect } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local centers are points in mm (+X right, +Y top, +Z above,
// right-handed); rectangle axes are directions with a local CCW rotation.
// Imported chip rotation stays zero to isolate the JSON-to-props conversion.
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
        type: "pcb_silkscreen_rect",
        pcb_silkscreen_rect_id: `input_rect_${side}_${row}`,
        pcb_component_id: "input_component",
        center: { x: 0, y: 0 },
        width: 6,
        height: 2,
        ccw_rotation: rotation,
        layer: "top",
        stroke_width: 0.15,
      } satisfies PcbSilkscreenRect,
    ],
  })),
)

const comparisons: {
  native: PcbSilkscreenRect
  imported: PcbSilkscreenRect
}[] = []

beforeAll(async () => {
  const { circuit } = getTestFixture()
  const inputBefore = JSON.stringify(cases)
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
            // SilkscreenRect exposes rotation through its parent. Match a
            // footprint-local rotation before mirroring: F R(theta) equals
            // R(-theta) F. PrimitiveComponent's
            // _computePcbGlobalTransformBeforeLayout applies the latter order
            // for parent rotation on a bottom-layer chip.
            pcbRotation={
              fixture.layer === "bottom" ? -fixture.rotation : fixture.rotation
            }
            footprint={
              <footprint>
                <silkscreenrect width={6} height={2} strokeWidth={0.15} />
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

  const rects = circuit.db.pcb_silkscreen_rect.list()
  expect(rects).toHaveLength(cases.length * 2)
  for (const fixture of cases) {
    const findRect = (name: string) => {
      const source = circuit.db.source_component.getWhere({ name })!
      const pcb = circuit.db.pcb_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      return rects.find(
        (rect) => rect.pcb_component_id === pcb.pcb_component_id,
      )!
    }
    const native = findRect(fixture.nativeName)
    const imported = findRect(fixture.importedName)
    expect(imported).toMatchObject({
      center: { x: fixture.importedX, y: fixture.y },
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
  expect(JSON.stringify(cases)).toBe(inputBefore)

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
