import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Panel unnamed PCB group repro", async () => {
  const { circuit } = getTestFixture()

  const boardWidth = 6
  const boardHeight = 2
  const numBoardsX = 4
  const numBoardsY = 4

  const boards: any[] = []
  for (let y = 0; y < numBoardsY; y++) {
    for (let x = 0; x < numBoardsX; x++) {
      boards.push({
        pcbX: x * boardWidth,
        pcbY: y * boardHeight,
      })
    }
  }

  circuit.add(
    <panel width={100} height={100} layoutMode="none">
      {boards.map((pos, i) => (
        <board
          width={boardWidth}
          height={boardHeight}
          key={i}
          pcbX={pos.pcbX - 50 + 3 + 2}
          pcbY={pos.pcbY - 50 + 1 + 2}
        >
          <resistor
            name="R1"
            footprint="0603"
            resistance="1k"
            pcbX={0}
            pcbY={0}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbGroup = circuitJson.filter((e) => e.type === "pcb_group")

  expect(pcbGroup.length).toBe(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
    showPcbGroups: true,
  })
})
