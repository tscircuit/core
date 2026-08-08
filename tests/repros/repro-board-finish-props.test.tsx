import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createReproBoard = (observedOutput?: string) => (
  <board
    width="20mm"
    height="10mm"
    topSolderMaskColor="red"
    bottomSolderMaskColor="blue"
    topSilkscreenColor="white"
    bottomSilkscreenColor="black"
    doubleSidedAssembly
  >
    <pcbnotetext
      pcbY={0}
      fontSize={0.7}
      text={`Requested: top mask red, bottom mask blue\nRequested: top silk white, bottom silk black\nRequested: double-sided assembly\nObserved pcb_board fields: ${observedOutput ?? "?"}`}
    />
  </board>
)

test("board per-side finish and assembly props are currently dropped", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  const observedOutput = JSON.stringify({
    top_solder_mask_color: board?.top_solder_mask_color,
    bottom_solder_mask_color: board?.bottom_solder_mask_color,
    top_silkscreen_color: board?.top_silkscreen_color,
    bottom_silkscreen_color: board?.bottom_silkscreen_color,
    double_sided_assembly: board?.double_sided_assembly,
  })

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(observedOutput))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(observedOutput).not.toContain("red")
  expect(observedOutput).not.toContain("blue")
  expect(observedOutput).not.toContain("white")
  expect(observedOutput).not.toContain("black")
  expect(observedOutput).not.toContain("true")
})
