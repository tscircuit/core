import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("unknown autorouterVersion warns and uses the latest pipeline", async () => {
  const consoleWarn = spyOn(console, "warn").mockImplementation(() => {})

  try {
    const { circuit } = getTestFixture()
    let solverStartedName: string | undefined

    circuit.on("solver:started", (event) => {
      solverStartedName = event.solverName
    })

    circuit.add(
      <board
        width="20mm"
        height="20mm"
        autorouter={{ local: true, groupMode: "subcircuit" }}
        autorouterVersion="v4"
      >
        <resistor name="R1" pcbX={-5} resistance={10000} footprint="0402" />
        <led name="LED1" pcbX={5} footprint="0603" />
        <trace from=".R1 > .pin2" to=".LED1 > .anode" />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(consoleWarn).toHaveBeenCalledWith(
      'Unknown autorouterVersion "v4", falling back to "latest".',
    )
    expect(solverStartedName).toBe("AutoroutingPipelineSolver7_MultiGraph")
  } finally {
    consoleWarn.mockRestore()
  }
})
