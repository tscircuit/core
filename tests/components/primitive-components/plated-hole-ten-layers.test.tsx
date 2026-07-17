import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated holes expose every copper layer on a ten-layer board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" layers={10}>
      <platedhole
        shape="circle"
        outerDiameter="1mm"
        holeDiameter="0.5mm"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const [platedHole] = project.db.pcb_plated_hole.list()
  expect(platedHole.layers).toEqual([
    "top",
    "bottom",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
  ])
})
