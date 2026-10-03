import { expect, test } from "bun:test"
import type { PcbHoleRotatedPill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("non-circular holes follow their own and their parent group's rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <hole
        name="H_RECT_OWN"
        shape="rect"
        width="3mm"
        height="1mm"
        pcbX={-6}
        pcbY={6}
        pcbRotation={90}
      />
      <hole
        name="H_OVAL_OWN"
        shape="oval"
        width="3mm"
        height="1mm"
        pcbX={6}
        pcbY={6}
        pcbRotation={270}
      />
      <group pcbRotation="90deg">
        <hole
          name="H_PILL_GROUP"
          shape="pill"
          width="3mm"
          height="1mm"
          pcbX={4}
          pcbY={0}
        />
        <hole
          name="H_RECT_GROUP"
          shape="rect"
          width="3mm"
          height="1mm"
          pcbX={-4}
          pcbY={0}
        />
        <hole
          name="H_OVAL_GROUP"
          shape="oval"
          width="3mm"
          height="1mm"
          pcbX={0}
          pcbY={4}
        />
        <hole
          name="H_PILL_GROUP_ANGLED"
          shape="pill"
          width="3mm"
          height="1mm"
          pcbX={0}
          pcbY={-4}
          pcbRotation={30}
        />
      </group>
    </board>,
  )

  circuit.render()

  const holes = circuit.db.pcb_hole.list()
  const sizes = holes.map((h: any) => ({
    shape: h.hole_shape,
    x: Math.round(h.x * 100) / 100 + 0,
    y: Math.round(h.y * 100) / 100 + 0,
    width: h.hole_width,
    height: h.hole_height,
  }))

  expect(sizes.slice(0, 5)).toEqual([
    { shape: "rect", x: -6, y: 6, width: 1, height: 3 },
    { shape: "oval", x: 6, y: 6, width: 1, height: 3 },
    { shape: "rotated_pill", x: 0, y: 4, width: 3, height: 1 },
    { shape: "rect", x: 0, y: -4, width: 1, height: 3 },
    { shape: "oval", x: -4, y: 0, width: 1, height: 3 },
  ])

  expect((holes[2] as PcbHoleRotatedPill).ccw_rotation).toBeCloseTo(90)

  const angledPill = holes[5] as PcbHoleRotatedPill
  expect(angledPill.hole_shape).toBe("rotated_pill")
  expect(angledPill.ccw_rotation).toBeCloseTo(120)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
