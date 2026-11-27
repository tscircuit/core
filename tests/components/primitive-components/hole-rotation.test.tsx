import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rect and oval holes rotate dimensions when rotated 90 or 270 degrees directly or via footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <hole
        name="H_rect_0"
        shape="rect"
        width="7mm"
        height="2mm"
        pcbX={-8}
        pcbY={4}
        pcbRotation={0}
      />
      <hole
        name="H_rect_90"
        shape="rect"
        width="7mm"
        height="2mm"
        pcbX={0}
        pcbY={4}
        pcbRotation={90}
      />
      <hole
        name="H_oval_90"
        shape="oval"
        width="7mm"
        height="2mm"
        pcbX={8}
        pcbY={4}
        pcbRotation={90}
      />
      <chip
        name="J1"
        pcbX={0}
        pcbY={-4}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.6mm"
              height="0.6mm"
              pcbX={-4}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="0.6mm"
              height="0.6mm"
              pcbX={4}
              portHints={["pin2"]}
            />
            <hole shape="rect" width="6mm" height="2mm" />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole.list()

  expect(holes).toHaveLength(4)

  const rect0 = holes[0] as any
  expect(rect0.hole_shape).toBe("rect")
  expect(rect0.hole_width).toBe(7)
  expect(rect0.hole_height).toBe(2)

  const rect90 = holes[1] as any
  expect(rect90.hole_shape).toBe("rect")
  expect(rect90.hole_width).toBe(2)
  expect(rect90.hole_height).toBe(7)

  const oval90 = holes[2] as any
  expect(oval90.hole_shape).toBe("oval")
  expect(oval90.hole_width).toBe(2)
  expect(oval90.hole_height).toBe(7)

  const footprintRect90 = holes[3] as any
  expect(footprintRect90.hole_shape).toBe("rect")
  expect(footprintRect90.hole_width).toBe(2)
  expect(footprintRect90.hole_height).toBe(6)
})
