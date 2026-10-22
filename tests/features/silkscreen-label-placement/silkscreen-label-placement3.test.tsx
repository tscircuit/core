import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ROTATIONS = [0, 90, 180, 270]
// An 0402's default label is centered 1.22 mm above the part, turned with it
const getPointAbovePart = (rotation: number, distance: number) => {
  const radians = (rotation * Math.PI) / 180
  return { x: -distance * Math.sin(radians), y: distance * Math.cos(radians) }
}
const DEFAULT_LABEL_DISTANCE = 1.22
// The hole clips the far edge of the default label, which stays readable
const HOLE_DISTANCE = DEFAULT_LABEL_DISTANCE + 0.3

test("silkscreen labels on both sides at every rotation leave holes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="10mm" routingDisabled>
      <pcbnotetext
        pcbY={5.8}
        fontSize={0.45}
        text="A hole clips each default label: top (upper row) and bottom (lower row) labels move off it; C1's label stays over C2's bottom pads"
      />
      {ROTATIONS.map((rotation, i) => {
        const hole = getPointAbovePart(rotation, HOLE_DISTANCE)
        return (
          <Fragment key={rotation}>
            <resistor
              name={`R${i + 1}`}
              resistance="1k"
              footprint="0402"
              pcbX={-6 + i * 4}
              pcbY={3}
              pcbRotation={rotation}
            />
            <hole
              pcbX={-6 + i * 4 + hole.x}
              pcbY={3 + hole.y}
              diameter="0.4mm"
            />
            <resistor
              name={`R${i + 5}`}
              resistance="1k"
              footprint="0402"
              layer="bottom"
              pcbX={-6 + i * 4}
              pcbY={-3}
              pcbRotation={rotation}
            />
            <hole
              pcbX={-6 + i * 4 + hole.x}
              pcbY={-3 + hole.y}
              diameter="0.4mm"
            />
          </Fragment>
        )
      })}
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={-0.6}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        layer="bottom"
        pcbX={0}
        pcbY={-0.6 + DEFAULT_LABEL_DISTANCE}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const getLabel = (name: string) =>
    circuit.db.pcb_silkscreen_text.list().find((text) => text.text === name)!
  const getLabelOffset = (name: string) => {
    const label = getLabel(name)
    const part = circuit.db.pcb_component.get(label.pcb_component_id!)!
    return {
      x: label.anchor_position.x - part.center.x,
      y: label.anchor_position.y - part.center.y,
    }
  }
  ROTATIONS.forEach((rotation, i) => {
    const defaultOffset = getPointAbovePart(rotation, DEFAULT_LABEL_DISTANCE)
    for (const name of [`R${i + 1}`, `R${i + 5}`]) {
      // Each label moved off the hole clipping its default spot
      const offset = getLabelOffset(name)
      expect(
        Math.hypot(offset.x - defaultOffset.x, offset.y - defaultOffset.y),
      ).toBeGreaterThan(0.1)
    }
    // Vertical labels read from the right edge of their side; bottom text is
    // mirrored, so it turns the other way
    expect([0, 90]).toContain(getLabel(`R${i + 1}`).ccw_rotation!)
    expect([0, 270]).toContain(getLabel(`R${i + 5}`).ccw_rotation!)
  })
  expect(getLabelOffset("C1")).toEqual({ x: 0, y: DEFAULT_LABEL_DISTANCE })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
