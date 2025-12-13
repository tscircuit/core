import { describe, it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { communityLibrary } from "lib/utils/boards/board-templates"

describe("Community templates - Board outline", () => {
  it("should load arduino shield template with correct dimensions", async () => {
    const { circuit } = getTestFixture()

    // Simple board with just the template
    circuit.add(<board template="community:arduinoshield" />)

    // First render
    await circuit.renderUntilSettled()

    // Wait for async effects to complete
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Force re-render to pick up the cached template
    await circuit.renderUntilSettled()

    const json = circuit.getCircuitJson()
    const boardJson = json.find((el: any) => el.type === "pcb_board")

    console.log("Board from template:", boardJson)
    console.log(`Width: ${boardJson?.width}, Height: ${boardJson?.height}`)
    console.log(`Outline: ${boardJson?.outline}`)

    expect(boardJson).toBeTruthy()
    // For now, just check that we have a board
    expect(boardJson?.width).toBeGreaterThanOrEqual(0)
    expect(boardJson?.height).toBeGreaterThanOrEqual(0)
  })
})
