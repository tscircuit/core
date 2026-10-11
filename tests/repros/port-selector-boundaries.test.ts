import { expect, test } from "bun:test"
import { Board, Chip, Port, Symbol as SchematicSymbol } from "lib"

test("port selector identity works before rendering, while duplicate names stay ambiguous", () => {
  for (const name of ["pin2", "gate", "2"]) {
    for (const symbolOwned of [false, true]) {
      const board = new Board({ width: 10, height: 10 })
      const chip = new Chip({ name: "U1" })
      board.add(chip)
      const owner = symbolOwned ? new SchematicSymbol({}) : chip
      if (owner !== chip) chip.add(owner)
      const port = new Port({ name, pinNumber: 2 })
      owner.add(port)
      const selector = port.getPortSelector()
      expect(board.selectAll(selector)).toEqual([port])
      expect(board.selectOne(selector, { type: "port" }) === port).toBe(true)
    }
  }

  const board = new Board({ width: 10, height: 10 })
  const duplicatePorts = [0, 1].map(() => {
    const chip = new Chip({ name: "U1" })
    const port = new Port({ name: "pin2", pinNumber: 2 })
    board.add(chip)
    chip.add(port)
    return port
  })
  expect(board.selectAll(duplicatePorts[0]!.getPortSelector())).toEqual(
    duplicatePorts,
  )
})
