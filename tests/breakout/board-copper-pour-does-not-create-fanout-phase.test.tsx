import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board plane drops stay in the board phase when a fanout exists", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="18mm" height="8mm" layers={4} autorouter="default">
      <copperpour layer="inner1" connectsTo="net.GND" />
      <fanout name="U1_FANOUT" pcbX={-3} padding="1mm" autorouter="auto">
        <chip
          name="U1"
          noSchematicRepresentation
          pinLabels={{ pin1: "A", pin2: "B" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={-0.5}
                width={0.4}
                height={0.4}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={0.5}
                width={0.4}
                height={0.4}
                shape="rect"
              />
            </footprint>
          }
        />
        <trace from="U1.A" to="U1.B" />
      </fanout>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={2}
        connections={{ pin1: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        connections={{ pin2: "net.GND" }}
      />
      <trace from="R1.pin2" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const groundNet = circuit.db.source_net.getWhere({ name: "GND" })!
  const boardGroundPhase = phases.find((phase) =>
    phase.startSimpleRouteJson?.connections.some(
      (connection) => connection.name === groundNet.source_net_id,
    ),
  )

  expect(phases).toHaveLength(2)
  expect(boardGroundPhase).toBeDefined()
  expect(
    boardGroundPhase?.startSimpleRouteJson?.buses?.some(
      (bus) => bus.termination?.type === "plane",
    ) ?? false,
  ).toBeFalse()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
