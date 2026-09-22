import { expect, test } from "bun:test"
import { Board, Chip, Footprint } from "lib"

class CountedChip extends Chip {
  componentNameReads = 0
  get componentName() {
    this.componentNameReads++
    return super.componentName
  }
}

test("missing footprint lookup is cached and add/remove/replacement invalidate it", () => {
  const board = new Board({ width: 10, height: 10 })
  const chip = new CountedChip({ name: "U1" })
  board.add(chip)
  expect(board._getFootprintOriginalLayer()).toBeUndefined()
  const reads = chip.componentNameReads
  for (let i = 0; i < 100; i++)
    expect(board._getFootprintOriginalLayer()).toBeUndefined()
  expect(chip.componentNameReads).toBe(reads)

  const bottom = new Footprint({ originalLayer: "bottom" })
  board.add(bottom)
  expect(board._getFootprintOriginalLayer()).toBe("bottom")
  // Same child count as before: length alone cannot invalidate this cache.
  board.remove(bottom)
  board.add(new Footprint({ originalLayer: "top" }))
  expect(board._getFootprintOriginalLayer()).toBe("top")
  board.remove(board.children[board.children.length - 1])
  expect(board._getFootprintOriginalLayer()).toBeUndefined()
})
