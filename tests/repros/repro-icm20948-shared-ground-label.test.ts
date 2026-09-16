import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import inputProblem from "./assets/icm20948-shared-ground-label-input.json"
import "tests/fixtures/extend-expect-any-svg"

test("ICM-20948 pins 9 and 11 share a downward GND label without overlap", async () => {
  const solver = new SchematicTracePipelineSolver(inputProblem as any)

  solver.solve()

  const groundLabel =
    solver.netLabelToTraceSolver!.outputNetLabelPlacements.find((label) =>
      label.pinIds.includes("schematic_port_115"),
    )!

  expect(groundLabel.pinIds).toContain("schematic_port_117")
  expect(groundLabel.orientation).toBe("y-")

  const svg = getSvgFromGraphicsObject(solver.visualize(), {
    backgroundColor: "white",
  })
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
