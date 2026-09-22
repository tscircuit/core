import { expect, spyOn, test } from "bun:test"
import { Board, Chip, Group, Net } from "lib"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

test("literal net creation reuses one scoped net scan across distinct names", () => {
  const board = new Board({ width: 10, height: 10 })
  const chip = new Chip({ name: "U1" })
  board.add(chip)
  const group = new Group({ name: "ordinary" })
  board.add(group)
  const nets = Array.from({ length: 100 }, (_, i) => new Net({ name: `N${i}` }))
  group.addAll(nets)
  const lookup = spyOn(board, "selectOne")
  const cachedNets = board.selectAll("net")
  for (let i = 0; i < nets.length; i++) createNetsFromProps(chip, [`net.N${i}`])
  expect(board.selectAll("net")).toBe(cachedNets)
  expect(board.selectAll("net")).toEqual(nets)
  // Distinct literal names must not trigger a CSS search for each cold selector.
  expect(lookup).not.toHaveBeenCalled()
  lookup.mockRestore()
})
