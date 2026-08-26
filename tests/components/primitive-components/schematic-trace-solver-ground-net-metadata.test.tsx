import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic trace solver input identifies ground nets", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </board>,
  )

  circuit.render()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  const groundConnection = inputProblem.netConnections.find(
    (connection) => connection.netId === "GND",
  )
  const powerConnection = inputProblem.netConnections.find(
    (connection) => connection.netId === "VCC",
  )

  expect(groundConnection).toMatchObject({ isGround: true })
  expect(powerConnection).toMatchObject({ isGround: false })
})
