import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { communityLibrary } from "lib/utils/boards/board-templates"

test("Community templates > should support all community templates", async () => {

  // Test all 4 community templates
  const templates = [
    { name: "arduinoshield", expectedWidth: 68.58, expectedHeight: 53.34 },
    { name: "raspberrypihat", expectedWidth: 65, expectedHeight: 56 },
    { name: "sparkfunmicromod_processor", expectedWidth: 22, expectedHeight: 22 },
    { name: "sparkfunmicromod_host", expectedWidth: 22, expectedHeight: 22 },
  ]

  for (const template of templates) {
    const { circuit: testCircuit } = getTestFixture()

    testCircuit.add(
      <board template={`community:${template.name}`} layer="top" />,
    )

    const json = await testCircuit.getCircuitJson()
    const boardJson = json.find((elm) => elm.type === "pcb_board")

    console.log(`Template: ${template.name}`)
    console.log(`  Expected: ${template.expectedWidth} x ${template.expectedHeight}`)
    console.log(`  Actual: ${boardJson?.width} x ${boardJson?.height}`)

    expect(boardJson?.width).toBe(template.expectedWidth)
    expect(boardJson?.height).toBe(template.expectedHeight)
    expect(boardJson?.outline).toBeDefined()

    expect(boardJson?.outline?.length).toBe(4)
  }
})
