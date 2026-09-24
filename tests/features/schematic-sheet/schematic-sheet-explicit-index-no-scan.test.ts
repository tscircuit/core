import { expect, spyOn, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Board } from "lib/components/normal-components/Board"
import { SchematicSheet } from "lib/components/primitive-components/SchematicSheet"

test("explicit sheet indices skip descendant enumeration, including index zero", () => {
  const circuit = new RootCircuit()
  const board = new Board({})
  circuit.add(board)
  circuit.render()
  const sheets = [0, 8, 42].map((sheetIndex) => {
    const sheet = new SchematicSheet({ sheetIndex })
    board.add(sheet)
    return sheet
  })
  const descendants = spyOn(board, "getDescendants")
  try {
    for (const sheet of sheets) sheet.doInitialSourceGroupRender()
    expect(descendants).not.toHaveBeenCalled()
    expect(
      circuit.db.schematic_sheet.list().map((sheet) => ({
        index: sheet.sheet_index,
        name: sheet.name,
      })),
    ).toEqual([
      { index: 0, name: "Sheet 1" },
      { index: 8, name: "Sheet 9" },
      { index: 42, name: "Sheet 43" },
    ])
  } finally {
    descendants.mockRestore()
  }
})
