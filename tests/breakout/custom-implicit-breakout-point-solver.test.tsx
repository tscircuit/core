import { expect, test } from "bun:test"
import type {
  ImplicitBreakoutPointSolverFn,
  ImplicitBreakoutPointSolverInput,
} from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("uses a custom implicit breakout point solver when provided", async () => {
  let solverCallCount = 0
  let receivedInput: ImplicitBreakoutPointSolverInput | undefined
  const implicitBreakoutPointSolverFn = ((input) => {
    solverCallCount += 1
    receivedInput = input
    const connections = input.connections.flatMap((connection) =>
      "type" in connection ? connection.connections : [connection],
    )
    return {
      breakoutPoints: input.regions.flatMap((region) =>
        connections.map((connection, connectionIndex) => ({
          regionId: region.regionId,
          connectionId: connection.connectionId,
          layer: "top",
          x: region.edge === "left" ? region.bounds.minX : region.bounds.maxX,
          y: region.bounds.minY + 0.5 + connectionIndex * 0.5,
        })),
      ),
    }
  }) satisfies ImplicitBreakoutPointSolverFn

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <breakout
        name="B1"
        pcbX={-4}
        padding="1mm"
        autorouter={{ implicitBreakoutPointSolverFn }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbY={-1} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbY={1} />
      </breakout>
      <breakout
        name="B2"
        pcbX={4}
        padding="1mm"
        autorouter={{ implicitBreakoutPointSolverFn }}
      >
        <resistor name="R3" resistance="1k" footprint="0402" pcbY={-1} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbY={1} />
      </breakout>
      <trace name="signal_a" from="R1.1" to="R3.1" />
      <trace name="signal_b" from="R2.1" to="R4.1" />
      <bus
        name="data_bus"
        connections={["signal_a", "signal_b"]}
        preferredLayers={["top", "bottom"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverCallCount).toBe(1)
  expect(receivedInput).toBeDefined()
  expect(receivedInput!.regions).toHaveLength(2)
  expect(receivedInput!.regions[0]).toHaveProperty("regionId")
  expect(receivedInput!.regions[0]).not.toHaveProperty("id")
  const firstConnection = receivedInput!.connections[0]!
  expect(firstConnection).toHaveProperty("connectionId")
  expect(firstConnection).not.toHaveProperty("id")
  expect(receivedInput!.buses).toEqual([
    {
      busId: "data_bus",
      connectionIds: expect.any(Array),
      targetLayers: ["top", "bottom"],
    },
  ])
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(4)
  expect(
    circuit.db.pcb_debug_object.list().map((debugObject) => debugObject.label),
  ).toEqual([
    "autorouting phase 0",
    "autorouting phase 1",
    "autorouting phase 2",
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
