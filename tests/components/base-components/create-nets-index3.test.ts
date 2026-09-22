import { expect, spyOn, test } from "bun:test"
import { Board, Chip, Net } from "lib"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

test("net creation preserves CSS fallback, class aliases, duplicates and validation", () => {
  const board = new Board({ width: 10, height: 10 })
  const chip = new Chip({ name: "U1" })
  const first = new Net({ name: "POWER ALIAS" })
  const duplicate = new Net({ name: "POWER" })
  board.addAll([chip, first, duplicate])
  createNetsFromProps(chip, ["net.ALIAS", "net.POWER"])
  expect(board.selectAll("net")).toEqual([first, duplicate])
  expect(board.selectOne<Net>("net.POWER")).toBe(first)
  const lookup = spyOn(board, "selectOne")
  createNetsFromProps(chip, ['net[name="POWER"]', 'net.POWER[name="POWER"]'])
  expect(lookup).toHaveBeenCalledWith('net.POWER[name="POWER"]')
  expect(board.selectAll("net")).toEqual([first, duplicate])
  lookup.mockRestore()
  for (const selector of ["net.A.B", "net.VCC+", "net.3V3"]) {
    expect(() => createNetsFromProps(chip, [selector])).toThrow()
  }
})
