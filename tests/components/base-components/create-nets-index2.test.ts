import { expect, test } from "bun:test"
import { Board, Chip, Group, Net } from "lib"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

test("net creation index follows ancestor invalidation and subcircuit boundaries", () => {
  const board = new Board({ width: 10, height: 10 })
  const chip = new Chip({ name: "U1" })
  const group = new Group({ name: "ordinary" })
  const isolated = new Group({ name: "isolated", subcircuit: true })
  board.addAll([chip, group, isolated])
  const isolatedChip = new Chip({ name: "U2" })
  const isolatedNet = new Net({ name: "POWER" })
  isolated.addAll([isolatedChip, isolatedNet])
  createNetsFromProps(chip, ["net.POWER", "net.POWER"])
  const boardNet = board.selectOne("net.POWER")!
  expect(boardNet).not.toBe(isolatedNet)
  expect(board.selectAll("net")).toEqual([boardNet])
  createNetsFromProps(isolatedChip, ["net.POWER"])
  expect(isolated.selectAll("net")).toEqual([isolatedNet])
  board.remove(boardNet)
  const replacement = new Net({ name: "POWER" })
  group.add(replacement)
  createNetsFromProps(chip, ["net.POWER"])
  expect(board.selectAll("net")).toEqual([replacement])
  group.remove(replacement)
  createNetsFromProps(chip, ["net.POWER"])
  expect(board.selectAll("net")).toHaveLength(1)
  expect(board.selectOne("net.POWER")).not.toBe(replacement)
})
