import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { layout } from "@tscircuit/layout"

test("board with manual layout edits", () => {
  const { project } = getTestFixture()

  project.add(
    <board
      width="20mm"
      height="20mm"
      layout={layout().manualEdits({
        pcb_placements: [
          {
            selector: ".R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
          {
            selector: ".C1",
            center: { x: -5, y: -5 },
            relative_to: "group_center",
          },
        ],
      })}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  )

  project.render()

  const resistor = project.selectOne(".R1")
  const capacitor = project.selectOne(".C1")

  expect(resistor).not.toBeNull()
  expect(capacitor).not.toBeNull()

  const resistorPosition = resistor!.getGlobalPcbPosition()
  const capacitorPosition = capacitor!.getGlobalPcbPosition()

  expect(resistorPosition.x).toBeCloseTo(5, 1)
  expect(resistorPosition.y).toBeCloseTo(5, 1)

  expect(capacitorPosition.x).toBeCloseTo(-5, 1)
  expect(capacitorPosition.y).toBeCloseTo(-5, 1)

  const r1SmtpadPositions = project
    .selectAll(".R1 > smtpad")
    .map((elm) => elm.getGlobalPcbPosition())

  expect(Math.abs(r1SmtpadPositions[0].x - 5)).toBeLessThan(1)
  expect(Math.abs(r1SmtpadPositions[1].x - 5)).toBeLessThan(1)

  expect(project.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
