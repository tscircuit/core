import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const expectedOutput = {
  top_solder_mask_color: "red",
  bottom_solder_mask_color: "blue",
  top_silkscreen_color: "white",
  bottom_silkscreen_color: "black",
  double_sided_assembly: true,
}

const createReproBoard = (observedOutput?: string) => {
  const status =
    observedOutput === JSON.stringify(expectedOutput) ? "correct" : "failing"

  return (
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
        text={`expected: ${JSON.stringify(expectedOutput)}\nobserved: ${observedOutput}\nstatus: ${status}`}
      />
    </board>
  )
}

test.failing("board should preserve per-side finish and assembly props", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  const boardOutput = board as unknown as Record<string, unknown>
  const observedOutput = JSON.stringify({
    top_solder_mask_color: boardOutput.top_solder_mask_color,
    bottom_solder_mask_color: boardOutput.bottom_solder_mask_color,
    top_silkscreen_color: boardOutput.top_silkscreen_color,
    bottom_silkscreen_color: boardOutput.bottom_silkscreen_color,
    double_sided_assembly: boardOutput.double_sided_assembly,
  })

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(observedOutput))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(observedOutput).toContain("red")
  expect(observedOutput).toContain("blue")
  expect(observedOutput).toContain("white")
  expect(observedOutput).toContain("black")
  expect(observedOutput).toContain("true")
})
