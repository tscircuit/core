import { expect, test } from "bun:test"
import { Board, Chip } from "lib"

test("empty selectors are cached and invalidated through ancestor tree changes", () => {
  const board = new Board({ width: 10, height: 10 })
  const missing = board.selectAll(".U1")
  expect(missing).toEqual([])
  expect(board.selectAll(".U1")).toBe(missing)

  const chip = new Chip({ name: "U1" })
  board.add(chip)
  expect(board.selectAll(".U1")).toEqual([chip])
  board.remove(chip)
  const removed = board.selectAll(".U1")
  expect(removed).toEqual([])
  expect(board.selectAll(".U1")).toBe(removed)
  board.add(chip)
  expect(board.selectAll(".U1")).toEqual([chip])
})
