import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("schematic trace routing emits solver:started event", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: any[] = []

  circuit.on("solver:started", (event) => {
    solverStartedEvents.push(event)
  })

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={-2}
        schY={0}
        pcbX={-2}
        pcbY={0}
      />
      <led name="D1" footprint="0603" schX={2} schY={0} pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".D1 > .anode" />
      <schematictext
        text="schematic trace solver emits solver:started"
        schX={0}
        schY={-2}
        fontSize={0.18}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicTraceSolverEvent = solverStartedEvents.find(
    (event) => event.solverName === "SchematicTracePipelineSolver",
  )

  expect(schematicTraceSolverEvent).toBeDefined()
  expect(schematicTraceSolverEvent?.componentName.replace(/#\d+/, "#")).toBe(
    "<board# />",
  )
  expect(schematicTraceSolverEvent?.solverParams).toMatchObject({
    chips: expect.any(Array),
    directConnections: expect.any(Array),
    netConnections: expect.any(Array),
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
