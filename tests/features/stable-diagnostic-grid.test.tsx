import { expect, test } from "bun:test"
import { Board, PcbNoteText, Resistor } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Colliding display IDs collapse unnamed grid children; geometry-dependent IDs
// stop matching the keys used before the grid moved those children.
test("unnamed components keep distinct stable display keys through PCB grid layout", () => {
  const renderedKeys = Array.from({ length: 2 }, () => {
    const { circuit } = getTestFixture()
    const board = new Board({
      width: "20mm",
      height: "20mm",
      pcbGrid: true,
      pcbGridGap: "2mm",
      routingDisabled: true,
    })
    board.addAll(
      Array.from(
        { length: 4 },
        () => new Resistor({ name: "", resistance: "10k", footprint: "0402" }),
      ),
    )
    board.add(
      new PcbNoteText({
        text: "Four unnamed resistors in a 2 x 2 grid",
        pcbY: 7,
      }),
    )
    circuit.add(board)
    let beforeLayout: string[] = []
    let afterLayout: string[] = []
    circuit.on("renderable:renderLifecycle:PcbLayout:start", (event) => {
      if (event.renderId === board._renderId) {
        beforeLayout = board
          .selectAll("resistor")
          .map((child) => child.getString())
      }
    })
    circuit.on("renderable:renderLifecycle:PcbLayout:end", (event) => {
      if (event.renderId === board._renderId) {
        afterLayout = board
          .selectAll("resistor")
          .map((child) => child.getString())
      }
    })
    circuit.render()

    expect(beforeLayout).toHaveLength(4)
    for (const displayKey of beforeLayout) {
      expect(displayKey).toMatch(/^<resistor#\d+(?:\.\d+)* \/>$/)
    }
    expect(new Set(beforeLayout).size).toBe(4)
    expect(afterLayout).toEqual(beforeLayout)
    const centers = circuit.db.pcb_component
      .list()
      .map((component) => component.center)
    expect(centers).toHaveLength(4)
    expect(new Set(centers.map(({ x, y }) => `${x},${y}`)).size).toBe(4)
    expect(new Set(centers.map(({ x }) => x)).size).toBe(2)
    expect(new Set(centers.map(({ y }) => y)).size).toBe(2)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    return afterLayout
  })

  expect(renderedKeys[0]).toEqual(renderedKeys[1])
})
