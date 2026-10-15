import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed labels enter routing as connected terminals while auto and inline labels remain solver-owned", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const inputs: InputProblem[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver")
      inputs.push(event.solverParams as InputProblem)
  })
  circuit.add(
    <board>
      <resistor
        name="R1"
        resistance="1k"
        schX={-2}
        connections={{ pin2: "net.SIGNAL" }}
      />
      <resistor
        name="R2"
        resistance="2k"
        schX={0}
        connections={{ pin2: "net.SIGNAL" }}
      />
      <resistor
        name="R3"
        resistance="3k"
        schX={2}
        connections={{ pin2: "net.SIGNAL" }}
      />
      <netlabel
        net="SIGNAL"
        connection=".R1 > .pin2"
        schX={-1.5}
        schY={-1}
        anchorSide="top"
      />
      <netlabel net="SIGNAL" connection=".R2 > .pin2" />
      <netlabel net="SIGNAL" connection=".R3 > .pin2" inline />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "R1")!
  const schematicComponent = circuit.db.schematic_component
    .list()
    .find(
      (component) =>
        component.source_component_id === sourceComponent.source_component_id,
    )!
  const fixedPort = circuit.db.schematic_port
    .list()
    .find(
      (port) =>
        port.schematic_component_id ===
          schematicComponent.schematic_component_id && port.pin_number === 2,
    )!
  expect(
    inputs.flatMap((input) => input.externallyConnectedPinIds ?? []),
  ).toEqual([fixedPort.schematic_port_id])
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
