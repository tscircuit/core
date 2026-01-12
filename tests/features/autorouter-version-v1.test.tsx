import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board with autorouterVersion v1 uses AutoroutingPipeline1_OriginalUnravel", async () => {
  const { circuit } = getTestFixture()

  let solverStartedName: string | undefined

  circuit.on("solver:started", (event) => {
    solverStartedName = event.solverName
  })

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
      autorouterVersion="v1"
    >
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={10000}
        footprint="0402"
      />
      <led name="LED1" pcbX={5} pcbY={0} footprint="0603" />

      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  // Wait for the render to complete, including autorouting
  await circuit.renderUntilSettled()

  // Verify that the correct solver was used
  expect(solverStartedName).toBe("AutoroutingPipeline1_OriginalUnravel")

  // Verify that we have PCB traces in the output
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThan(0)

  // Match against a PCB snapshot to verify routing
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
