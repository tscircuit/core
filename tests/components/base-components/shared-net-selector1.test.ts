import { expect, spyOn, test } from "bun:test"
import { Board, Net } from "lib"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

test("creation and later typed net selectors share a single alias index", () => {
  const board = new Board({ width: 10, height: 10 })
  const nets = Array.from({ length: 100 }, (_, i) => new Net({ name: `N${i}` }))
  board.addAll(nets)
  const aliases = spyOn(nets[0]!, "getNameAndAliases")
  try {
    for (let i = 0; i < nets.length; i++) {
      createNetsFromProps(board, [`net.N${i}`])
    }
    // Repeat with the option used by Via and Trace's SourceTraceRender phase.
    for (let i = 0; i < nets.length; i++) {
      expect(board.selectOne<Net>(`net.N${i}`, { type: "net" })).toBe(nets[i])
    }
    expect(aliases).toHaveBeenCalledTimes(1)
  } finally {
    aliases.mockRestore()
  }
})
