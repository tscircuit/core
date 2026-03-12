import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board with autorouterVersion v3 uses AutoroutingPipelineSolver3_HgPortPointPathing", async () => {
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
      autorouterVersion="v3"
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

  await circuit.renderUntilSettled()

  expect(solverStartedName).toBe(
    "AutoroutingPipelineSolver3_HgPortPointPathing",
  )

  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThan(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
