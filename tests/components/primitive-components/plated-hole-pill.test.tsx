import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { PcbPlatedHole, PcbPlatedHoleOval } from "circuit-json"

test("PlatedHole pill shape", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <platedhole
        shape="pill"
        outerWidth="2mm"
        outerHeight="4mm"
        holeWidth="1mm"
        holeHeight="2mm"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const platedHoles = project.db.pcb_plated_hole.list() as PcbPlatedHoleOval[]
  expect(platedHoles.length).toBe(1)
  expect(platedHoles[0].shape).toBe("pill")
  expect(platedHoles[0].outer_width).toBe(2)
  expect(platedHoles[0].outer_height).toBe(4)
  expect(platedHoles[0].hole_width).toBe(1)
  expect(platedHoles[0].hole_height).toBe(2)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
