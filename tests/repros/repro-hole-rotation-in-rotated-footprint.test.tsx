import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("non-circular holes rotate with their rotated footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="16mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="3mm"
              height="1mm"
              pcbX={-3.5}
              pcbY={0}
              portHints={["1"]}
            />
            <hole shape="pill" width="3mm" height="1mm" pcbX={1} pcbY={4} />
            <hole shape="rect" width="3mm" height="1mm" pcbX={1} pcbY={0} />
            <hole shape="oval" width="3mm" height="1mm" pcbX={1} pcbY={-4} />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY={7}
        text="U1 pcbRotation=90: pad and holes should all be vertical"
        fontSize="0.4mm"
      />
      <pcbnotetext
        pcbY={-7}
        text="3x1mm pill/rect/oval holes stay horizontal (bug)"
        fontSize="0.4mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const pad = circuit.db.pcb_smtpad.list()[0]
  expect(pad).toMatchObject({ shape: "rect", width: 1, height: 3 })

  const holes = circuit.db.pcb_hole.list().map((hole) => ({
    hole_shape: hole.hole_shape,
    hole_width: "hole_width" in hole ? hole.hole_width : undefined,
    hole_height: "hole_height" in hole ? hole.hole_height : undefined,
    ccw_rotation: "ccw_rotation" in hole ? hole.ccw_rotation : undefined,
  }))

  expect(holes).toEqual([
    {
      hole_shape: "rotated_pill",
      hole_width: 3,
      hole_height: 1,
      ccw_rotation: 90,
    },
    {
      hole_shape: "rect",
      hole_width: 1,
      hole_height: 3,
      ccw_rotation: undefined,
    },
    {
      hole_shape: "oval",
      hole_width: 1,
      hole_height: 3,
      ccw_rotation: undefined,
    },
  ])
})
