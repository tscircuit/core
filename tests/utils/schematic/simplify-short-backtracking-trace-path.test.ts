import { expect, test } from "bun:test"
import { simplifyShortBacktrackingTracePath } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/simplify-short-backtracking-trace-path"

test("simplifies only collision-free short backtracking schematic traces", () => {
  const backtrackingPoints = [
    { x: 0, y: 0 },
    { x: 0.2, y: 0 },
    { x: 0.2, y: 0.1 },
    { x: 0.1, y: 0.1 },
    { x: 0.1, y: 0.2 },
    { x: 0.3, y: 0.2 },
  ]
  const pins = [
    { x: 0, y: 0, chipId: "left", _facingDirection: "x+" as const },
    { x: 0.3, y: 0.2, chipId: "right", _facingDirection: "x-" as const },
  ]

  expect(
    simplifyShortBacktrackingTracePath({
      points: backtrackingPoints,
      pins,
      getObstacles: () => [],
    }),
  ).toEqual([
    { x: 0, y: 0 },
    { x: 0.15, y: 0 },
    { x: 0.15, y: 0.2 },
    { x: 0.3, y: 0.2 },
  ])

  expect(
    simplifyShortBacktrackingTracePath({
      points: backtrackingPoints,
      pins,
      getObstacles: () => [
        {
          minX: 0.14,
          maxX: 0.16,
          minY: 0.05,
          maxY: 0.15,
          kind: "chip",
          chipId: "middle",
        },
      ],
    }),
  ).toEqual(backtrackingPoints)
})
