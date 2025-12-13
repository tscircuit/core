import { describe, it, expect } from "bun:test"
import { writeFileSync } from "fs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { communityLibrary } from "lib/utils/boards/board-templates"

describe("Community templates", () => {
  it("should load and render a community template board with template prop", async () => {
    const template = await communityLibrary.getTemplate("arduinoshield")
    console.log("Direct template lookup result:", template)

    const { circuit } = getTestFixture()

    circuit.add(
      <board template="community:arduinoshield">
        {/* <resistor name="R1" resistance="10k" footprint="0805" />
        <led name="LED1" color="red" footprint="led0603" />
        <trace from="R1.pin1" to="LED1.pin1" />
        <trace from="R1.pin2" to="LED1.pin2" /> */}
      </board>,
    )

    // Use renderUntilSettled to wait for async effects like template loading
    await circuit.renderUntilSettled()
    const svg = await circuit.getSvg({ view: "pcb" })
    console.log("SVG generated successfully")
    const json = await circuit.getCircuitJson()
    console.log("JSON generated successfully")

    // Save JSON to file
    writeFileSync("./output.json", JSON.stringify(json, null, 2))
    console.log("JSON saved to ./output.json")

    // Save SVG to file
    writeFileSync("./output.svg", svg)
    console.log("SVG saved to ./output.svg")

    expect(svg).toBeTruthy()
    expect(json).toBeTruthy()

    // Verify board dimensions from Arduino Shield template (68.58mm x 53.34mm)
    const boardJson = json.find((el: any) => el.type === "pcb_board")
    console.log("Board JSON:", boardJson)
    expect(boardJson).toBeTruthy()
    // Debug: log actual dimensions
    console.log(`Board dimensions: ${boardJson?.width} x ${boardJson?.height}`)
    // The template should give us 68.58 x 53.34
    expect(boardJson?.width).toBeCloseTo(68.58, 1)
    expect(boardJson?.height).toBeCloseTo(53.34, 1)
  })
})
