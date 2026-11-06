import { expect, test } from "bun:test"
import { computeSchematicSectionLayoutUsingRows } from "lib/components/primitive-components/Group/computeSchematicSectionLayoutUsingRows"

test("row layout preserves sheetless behavior and permits an individually oversized section", () => {
  const sectionBlocks = [
    { sectionName: "A", size: { x: 5, y: 2 } },
    { sectionName: "B", size: { x: 5, y: 2 } },
    { sectionName: "C", size: { x: 20, y: 2 } },
  ]
  const groupSchPositionBeforeLayout = { x: 2, y: 3 }
  const unconstrained = computeSchematicSectionLayoutUsingRows({
    sectionBlocks,
    groupSchPositionBeforeLayout,
  })
  const narrow = computeSchematicSectionLayoutUsingRows({
    sectionBlocks,
    groupSchPositionBeforeLayout,
    maxRowWidth: 10,
  })
  expect(unconstrained.get("A")!.y).toBe(unconstrained.get("B")!.y)
  expect(narrow.get("A")!.y).not.toBe(narrow.get("B")!.y)
  expect(narrow.get("C")!.x).toBe(groupSchPositionBeforeLayout.x)
  expect(narrow.size).toBe(3)
})
