import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual vias resolve all tenting modes and overrides without changing hole geometry", () => {
  const cases = [
    [undefined, undefined, undefined],
    [true, true, true],
    [false, false, false],
    ["both_sides", true, true],
    ["top_and_bottom_tented", true, true],
    ["top_tented", true, false],
    ["bottom_tented", false, true],
    ["exposed", false, false],
  ] as const

  for (const [defaultViaTenting, defaultTop, defaultBottom] of cases) {
    for (const [tented, top, bottom] of cases) {
      const { circuit } = getTestFixture()
      const board = new Board({ width: 12, height: 8, defaultViaTenting })
      board.add(
        <via
          name="V1"
          tented={tented}
          holeDiameter={0.3}
          outerDiameter={0.6}
        />,
      )
      board.add(
        new PcbVia({ pcbX: 2, tented, holeDiameter: 0.3, outerDiameter: 0.6 }),
      )
      board.add(
        <platedhole
          pcbX={4}
          shape="circle"
          holeDiameter={1}
          outerDiameter={2}
        />,
      )
      circuit.add(board)
      circuit.render()
      const vias = circuit.db.pcb_via.list()
      expect(vias).toHaveLength(2)
      for (const via of vias) {
        expect(via).toMatchObject({
          tented_on_top: top ?? defaultTop,
          tented_on_bottom: bottom ?? defaultBottom,
          hole_diameter: 0.3,
          outer_diameter: 0.6,
          layers: ["top", "bottom"],
        })
        expect(via).not.toHaveProperty("is_tented")
      }
      expect(circuit.db.pcb_plated_hole.list()[0]).toMatchObject({
        hole_diameter: 1,
        outer_diameter: 2,
      })
      if (tented === undefined) {
        expect(circuit.selectOne(".V1")?._parsedProps.tented).toBeUndefined()
      }
    }
  }
})
