import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

test("custom autorouting algorithmFn", async () => {
  const { circuit } = getTestFixture()

  let autorouterFinished = false

  // Create a circuit with two components that need to be connected by a trace
  // The capacity mesh autorouter will be used to find the optimal route
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (simpleRouteJson) => {
          const autorouter = new TscircuitAutorouter(simpleRouteJson)
          autorouter.on("complete", () => {
            autorouterFinished = true
          })
          return autorouter
        },
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

  // Wait for the render to complete, including autorouting
  await circuit.renderUntilSettled()

  expect(autorouterFinished).toBe(true)
})
