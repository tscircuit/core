import { expect, test } from "bun:test"
import type { PcbSmtPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Point = { x: number; y: number }

const getPadCorners = (pad: PcbSmtPad): Point[] => {
  if (pad.shape === "circle") {
    const r = pad.radius
    return [
      { x: pad.x - r, y: pad.y - r },
      { x: pad.x + r, y: pad.y - r },
      { x: pad.x + r, y: pad.y + r },
      { x: pad.x - r, y: pad.y + r },
    ]
  }
  if (pad.shape === "polygon") return pad.points
  const width = pad.width
  const height = pad.height
  const rotationDeg =
    "ccw_rotation" in pad && typeof pad.ccw_rotation === "number"
      ? pad.ccw_rotation
      : 0
  const theta = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ].map((p) => ({
    x: pad.x + p.x * cos - p.y * sin,
    y: pad.y + p.x * sin + p.y * cos,
  }))
}

const getCornersOutside = (
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  pads: PcbSmtPad[],
) => {
  const tolerance = 1e-6
  return pads
    .flatMap(getPadCorners)
    .filter(
      (c) =>
        c.x < bounds.minX - tolerance ||
        c.x > bounds.maxX + tolerance ||
        c.y < bounds.minY - tolerance ||
        c.y > bounds.maxY + tolerance,
    )
}

test("courtyard rect follows pcbRotation of its component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-14}
        pcbY={0}
        pcbRotation={90}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0603"
        pcbX={-10}
        pcbY={0}
        pcbRotation={270}
      />
      <chip
        name="F1"
        pcbX={-2}
        pcbY={0}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-3.3875}
              pcbY={0}
              width={2.425}
              height={5.45}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={3.3875}
              pcbY={0}
              width={2.425}
              height={5.45}
              shape="rect"
            />
            <courtyardrect width={9.2} height={6.2} />
          </footprint>
        }
      />
      <chip
        name="J1"
        pcbX={11}
        pcbY={0}
        pcbRotation={270}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-4}
              pcbY={2}
              width={1.5}
              height={3}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={6}
              pcbY={2}
              width={1.5}
              height={3}
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={1}
              pcbY={-2.5}
              width={9}
              height={2}
              shape="rect"
            />
            <courtyardrect pcbX={1} pcbY={0} width={13.2} height={10.2} />
          </footprint>
        }
      />
      <chip
        name="U1"
        pcbX={-12}
        pcbY={-6}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              pcbY={0}
              width={1}
              height={2}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={2}
              pcbY={0}
              width={1}
              height={2}
              shape="rect"
            />
            <courtyardoutline
              outline={[
                { x: -3, y: -1.5 },
                { x: 3, y: -1.5 },
                { x: 3, y: 1.5 },
                { x: -3, y: 1.5 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const courtyardRects = circuitJson.filter(
    (e) => e.type === "pcb_courtyard_rect",
  )
  const smtpads = circuitJson.filter((e) => e.type === "pcb_smtpad")
  const sourceComponents = circuitJson.filter(
    (e) => e.type === "source_component",
  )
  const pcbComponents = circuitJson.filter((e) => e.type === "pcb_component")

  const nameForPcbComponent = (pcbComponentId: string) => {
    const pcbComponent = pcbComponents.find(
      (c) => c.pcb_component_id === pcbComponentId,
    )
    return sourceComponents.find(
      (s) => s.source_component_id === pcbComponent?.source_component_id,
    )?.name
  }

  const padsFor = (pcbComponentId: string) =>
    smtpads.filter((p) => p.pcb_component_id === pcbComponentId)

  expect(
    courtyardRects
      .map((courtyard) => nameForPcbComponent(courtyard.pcb_component_id))
      .sort(),
  ).toEqual(["C1", "F1", "J1", "R1"])

  // Every component here is rotated by a quarter turn, so its courtyard rect
  // can be described exactly by an axis-aligned center/width/height. Tools such
  // as calculate-packing (used by core's pack layout) read only
  // center/width/height, so that is how the rect is checked here.
  const padsOutsideCourtyardRect: Record<string, unknown> = {}
  for (const courtyard of courtyardRects) {
    const pads = padsFor(courtyard.pcb_component_id)
    expect(pads.length).toBeGreaterThan(0)
    const outside = getCornersOutside(
      {
        minX: courtyard.center.x - courtyard.width / 2,
        maxX: courtyard.center.x + courtyard.width / 2,
        minY: courtyard.center.y - courtyard.height / 2,
        maxY: courtyard.center.y + courtyard.height / 2,
      },
      pads,
    )
    if (outside.length > 0) {
      padsOutsideCourtyardRect[
        nameForPcbComponent(courtyard.pcb_component_id)!
      ] = {
        courtyard: {
          center: courtyard.center,
          width: courtyard.width,
          height: courtyard.height,
          ccw_rotation: courtyard.ccw_rotation,
        },
        padCornersOutside: outside.length,
      }
    }
  }

  // Control: courtyard outlines transform every point, so they already follow
  // the component rotation.
  const courtyardOutlines = circuitJson.filter(
    (e) => e.type === "pcb_courtyard_outline",
  )
  expect(courtyardOutlines.length).toBe(1)
  const outlinePoints = courtyardOutlines[0].outline
  expect(
    getCornersOutside(
      {
        minX: Math.min(...outlinePoints.map((p) => p.x)),
        maxX: Math.max(...outlinePoints.map((p) => p.x)),
        minY: Math.min(...outlinePoints.map((p) => p.y)),
        maxY: Math.max(...outlinePoints.map((p) => p.y)),
      },
      padsFor(courtyardOutlines[0].pcb_component_id),
    ),
  ).toEqual([])

  // circuit-to-svg applies ccw_rotation when drawing, so the snapshot drops it
  // to show each courtyard rect the way center/width/height-only consumers
  // see it.
  const courtyardRectsAsAxisAligned = circuitJson.map((e) =>
    e.type === "pcb_courtyard_rect" ? { ...e, ccw_rotation: undefined } : e,
  )
  expect(courtyardRectsAsAxisAligned).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })

  expect(padsOutsideCourtyardRect).toEqual({})
})
