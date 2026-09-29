import { expect, test } from "bun:test"
import { Board, Hole } from "lib"
import { cssSelectPrimitiveComponentAdapter } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Removing IDs altogether makes otherwise identical primitives indistinguishable.
test("named and anonymous primitives remain distinguishable when attached or removed", () => {
  const attachedNames = Array.from({ length: 2 }, () => {
    const { circuit } = getTestFixture()
    const board = new Board({
      name: "B1",
      width: 20,
      height: 20,
      routingDisabled: true,
    })
    const holes = [
      new Hole({ diameter: 1, pcbX: -6 }),
      new Hole({ diameter: 1, pcbX: -2 }),
      new Hole({ name: "H", diameter: 1, pcbX: 2 }),
      new Hole({ name: "H", diameter: 1, pcbX: 6 }),
    ]
    const detachedNames = holes.map((hole) => hole.getString())
    const runtimeIds = holes.map((hole) => hole._renderId)
    expect(new Set(detachedNames).size).toBe(4)
    board.addAll(holes)
    circuit.add(board)
    circuit.render()

    expect(new Set(holes.map((hole) => hole.getString())).size).toBe(4)
    expect(holes[0].getString()).toMatch(/^<hole#\d+(?:\.\d+)* \/>$/)
    expect(holes[2].getString()).toContain("(.B1>.H)")
    expect(circuit.selectAll("hole")).toEqual(holes)
    expect(circuit.selectAll(".H")).toEqual(holes.slice(2))
    expect(
      cssSelectPrimitiveComponentAdapter!.equals!(holes[0], holes[1]),
    ).toBe(false)
    expect(
      cssSelectPrimitiveComponentAdapter!.equals!(holes[2], holes[3]),
    ).toBe(false)
    expect(holes.map((hole) => hole._renderId)).toEqual(runtimeIds)
    const names = holes.map((hole) => hole.getString())

    // remove() retains parent pointers: removed siblings must not share a -1 ID.
    for (const hole of holes) board.remove(hole)
    expect(new Set(holes.map((hole) => hole.getString())).size).toBe(4)
    for (const hole of holes) {
      expect(hole.getString()).toContain(`#${hole._renderId}`)
    }
    return names
  })
  expect(attachedNames[0]).toEqual(attachedNames[1])
})
