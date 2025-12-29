import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("autorouterEffortLevel passes effort into local autorouter", async () => {
  const { circuit } = getTestFixture()
  let solverStartedEvent: any

  circuit.on("solver:started", (event) => {
    if (
      event.solverName === "AutoroutingPipelineSolver" ||
      event.solverName === "AssignableAutoroutingPipeline2"
    ) {
      solverStartedEvent = event
    }
  })

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouterEffortLevel="2x"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={10000}
        footprint="0402"
      />
      <resistor
        name="R2_obstacle"
        resistance="1k"
        pcbX={0}
        pcbY={0}
        footprint="0402"
      />
      <led name="LED1" pcbX={5} pcbY={0} footprint="0603" />

      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverStartedEvent).toBeDefined()
  expect(solverStartedEvent?.solverParams?.options?.effort).toBe(2)
})
