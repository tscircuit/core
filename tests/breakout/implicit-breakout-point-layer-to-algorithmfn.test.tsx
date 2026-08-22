import { expect, test } from "bun:test"
import type { ImplicitBreakoutPointSolverFn } from "@tscircuit/props"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit breakout point layer reaches a custom autorouter", async () => {
  let solverTargetLayers: readonly string[] | undefined
  const receivedSimpleRouteJson: SimpleRouteJson[] = []

  const implicitBreakoutPointSolverFn = ((input) => {
    const selectedLayers = input.buses[0]?.targetLayers
    solverTargetLayers = selectedLayers
    if (!selectedLayers?.length) {
      throw new Error("Expected preferred breakout layers")
    }

    const connections = input.connections.flatMap((connection) =>
      "type" in connection ? connection.connections : [connection],
    )

    return {
      breakoutPoints: input.regions.flatMap((region) =>
        connections.map((connection, connectionIndex) => ({
          regionId: region.regionId,
          connectionId: connection.connectionId,
          layer: selectedLayers[connectionIndex % selectedLayers.length]!,
          x: region.edge === "left" ? region.bounds.minX : region.bounds.maxX,
          // Coincident x/y is valid because each connection uses a distinct layer.
          y: region.bounds.minY + 0.5,
        })),
      ),
    }
  }) satisfies ImplicitBreakoutPointSolverFn

  const algorithmFn = createBasicAutorouter(async (simpleRouteJson) => {
    receivedSimpleRouteJson.push(structuredClone(simpleRouteJson))
    return []
  })

  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="10mm"
      layers={4}
      autorouter={{
        implicitBreakoutPointSolverFn,
        algorithmFn,
      }}
    >
      <breakout
        name="B1"
        pcbX={-4}
        padding="1mm"
        autorouter={{ implicitBreakoutPointSolverFn, algorithmFn }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbY={-1} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbY={1} />
      </breakout>
      <breakout
        name="B2"
        pcbX={4}
        padding="1mm"
        autorouter={{ implicitBreakoutPointSolverFn, algorithmFn }}
      >
        <resistor name="R3" resistance="1k" footprint="0402" pcbY={-1} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbY={1} />
      </breakout>
      <trace name="signal_a" from="R1.1" to="R3.1" />
      <trace name="signal_b" from="R2.1" to="R4.1" />
      <bus
        name="data_bus"
        connections={["signal_a", "signal_b"]}
        preferredLayers={["inner1", "inner2"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverTargetLayers).toEqual(["inner1", "inner2"])
  const breakoutPoints = circuit.db.pcb_breakout_point.list()
  const breakoutPointIds = new Set(
    breakoutPoints.map((breakoutPoint) => breakoutPoint.pcb_breakout_point_id),
  )
  const receivedBreakoutTargets = receivedSimpleRouteJson.flatMap(
    (simpleRouteJson) =>
      simpleRouteJson.connections.flatMap((connection) =>
        connection.pointsToConnect.filter((point) =>
          breakoutPointIds.has(point.pointId ?? ""),
        ),
      ),
  )

  expect(
    new Set(receivedBreakoutTargets.map((point) => point.pointId)),
  ).toEqual(breakoutPointIds)
  expect(new Set(receivedBreakoutTargets.map((point) => point.layer))).toEqual(
    new Set(["inner1", "inner2"]),
  )

  const receivedBreakoutTargetByPointId = new Map(
    receivedBreakoutTargets.map((point) => [point.pointId, point]),
  )
  for (const breakoutPoint of breakoutPoints) {
    const receivedTarget = receivedBreakoutTargetByPointId.get(
      breakoutPoint.pcb_breakout_point_id,
    )!
    expect({ x: receivedTarget.x, y: receivedTarget.y }).toEqual({
      x: breakoutPoint.x,
      y: breakoutPoint.y,
    })
  }

  const layersByCoordinate = new Map<string, Set<string>>()
  for (const receivedTarget of receivedBreakoutTargetByPointId.values()) {
    const coordinateKey = `${receivedTarget.x},${receivedTarget.y}`
    const layers = layersByCoordinate.get(coordinateKey) ?? new Set<string>()
    layers.add(receivedTarget.layer)
    layersByCoordinate.set(coordinateKey, layers)
  }
  expect(
    [...layersByCoordinate.values()].map((layers) => [...layers].sort()),
  ).toEqual([
    ["inner1", "inner2"],
    ["inner1", "inner2"],
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
