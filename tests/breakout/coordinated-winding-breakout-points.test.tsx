import { expect, spyOn, test } from "bun:test"
import {
  WindingBreakoutSolver,
  type ConnectionEndpoint,
} from "@tscircuit/winding-breakout-point-solver"
import type { Bus } from "lib/components/primitive-components/Bus"
import type { Breakout } from "lib/components/primitive-components/Breakout/Breakout"
import { createCoordinatedWindingBreakoutInput } from "lib/components/primitive-components/Breakout/create-coordinated-winding-breakout-input"
import { solveCoordinatedWindingBreakoutPoints } from "lib/components/primitive-components/Breakout/solve-coordinated-winding-breakout-points"
import {
  Am62lLpddr4BreakoutRepro,
  DDR_CONNECTIONS,
} from "tests/fixtures/am62l-lpddr4-breakout-repro"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("integrates the cloned AM62L/LPDDR4 breakout repro", async () => {
  const windingSolveSpy = spyOn(WindingBreakoutSolver.prototype, "solve")
  const { circuit } = getTestFixture()
  circuit.add(<Am62lLpddr4BreakoutRepro routingDisabled />)

  await circuit.renderUntilSettled()

  expect(windingSolveSpy).toHaveBeenCalledTimes(1)
  windingSolveSpy.mockRestore()
  const originalBuses = circuit.selectAll("bus") as Bus[]
  expect(originalBuses.map((bus) => bus.name)).toEqual([
    "DDR_BYTE0",
    "DDR_BYTE1",
    "DDR_ADDR_CTRL",
  ])
  expect(originalBuses.map((bus) => bus._parsedProps.preferredLayers)).toEqual([
    ["inner1", "inner4"],
    ["inner2", "inner5"],
    ["inner3", "inner6"],
  ])

  expect(circuit.db.source_trace.list()).toHaveLength(DDR_CONNECTIONS.length)
  const socBreakout = circuit.selectOne(".SOC_BREAKOUT") as Breakout
  const coordinatedInput = createCoordinatedWindingBreakoutInput(socBreakout)
  const solverInput = coordinatedInput.solverInput
  expect(solverInput.regions.map((region) => region.bounds)).toEqual([
    {
      minX: -15.65,
      maxX: -4.35,
      minY: -5.650000000000001,
      maxY: 5.650000000000001,
    },
    {
      minX: 3.0919170000000014,
      maxX: 17.141917,
      minY: -4.650917000000001,
      maxY: 4.549083,
    },
  ])
  expect(solverInput.regions.map((region) => region.edge)).toEqual([
    "right",
    "left",
  ])
  expect(solverInput.boundaryPointSpacing).toBeCloseTo(0.71976)
  expect(
    solverInput.buses.map((bus) => ({
      id: bus.id,
      preferredLayer: bus.preferredLayer,
      preferredLayers: bus.preferredLayers,
    })),
  ).toEqual([
    {
      id: "DDR_BYTE0",
      preferredLayer: undefined,
      preferredLayers: ["inner1", "inner4"],
    },
    {
      id: "DDR_BYTE1",
      preferredLayer: undefined,
      preferredLayers: ["inner2", "inner5"],
    },
    {
      id: "DDR_ADDR_CTRL",
      preferredLayer: undefined,
      preferredLayers: ["inner3", "inner6"],
    },
  ])

  const sourceTraceById = new Map(
    circuit.db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
  )
  const fixtureRegionIdByPcbGroupId = new Map<string, string>()
  for (const [fixtureRegionId, pcbGroupName] of [
    ["soc", "SOC_BREAKOUT"],
    ["ram", "RAM_BREAKOUT"],
  ] as const) {
    const pcbGroup = circuit.db.pcb_group.getWhere({ name: pcbGroupName })
    if (!pcbGroup) throw new Error(`Missing PCB group "${pcbGroupName}"`)
    fixtureRegionIdByPcbGroupId.set(pcbGroup.pcb_group_id, fixtureRegionId)
  }

  const canonicalSolverConnections: Array<{
    id: string
    endpoints: readonly ConnectionEndpoint[]
  }> = []
  for (const connection of solverInput.connections) {
    if ("type" in connection) {
      for (const pairMember of connection.connections) {
        canonicalSolverConnections.push({
          id: pairMember.id,
          endpoints: pairMember.endpoints,
        })
      }
      continue
    }
    canonicalSolverConnections.push(connection)
  }
  expect(canonicalSolverConnections).toHaveLength(DDR_CONNECTIONS.length)
  for (const connection of canonicalSolverConnections) {
    const sourceTrace = sourceTraceById.get(connection.id)
    if (!sourceTrace?.name) {
      throw new Error(`Missing source trace for "${connection.id}"`)
    }
    const expectedConnection = DDR_CONNECTIONS.find(
      (candidate) => candidate.traceName === sourceTrace.name,
    )
    if (!expectedConnection) {
      throw new Error(`Missing solver fixture connection "${sourceTrace.name}"`)
    }
    expect(connection.endpoints).toHaveLength(solverInput.regions.length)
    for (const endpoint of connection.endpoints) {
      const fixtureRegionId = fixtureRegionIdByPcbGroupId.get(endpoint.regionId)
      if (!fixtureRegionId) {
        throw new Error(`Unknown fixture region "${endpoint.regionId}"`)
      }
      const expectedPcbPort = circuit.db.pcb_port
        .list()
        .find(
          (pcbPort) =>
            pcbPort.pcb_group_id === endpoint.regionId &&
            pcbPort.source_port_id !== undefined &&
            sourceTrace.connected_source_port_ids.includes(
              pcbPort.source_port_id,
            ),
        )
      if (expectedPcbPort?.x === undefined || expectedPcbPort.y === undefined) {
        throw new Error(
          `Missing ${sourceTrace.name} PCB port for "${fixtureRegionId}"`,
        )
      }
      expect(endpoint.position.x).toBeCloseTo(expectedPcbPort.x, 9)
      expect(endpoint.position.y).toBeCloseTo(expectedPcbPort.y, 9)
    }
  }

  const differentialPairInputs = solverInput.connections.filter(
    (connection) => "type" in connection,
  )
  expect(differentialPairInputs).toHaveLength(3)

  const solver = new WindingBreakoutSolver(solverInput)
  solver.solve()
  const output = solver.getOutput()
  expect(output.breakoutPoints).toHaveLength(DDR_CONNECTIONS.length * 2)
  const allowedLayersByConnectionId = new Map(
    solverInput.buses.flatMap((bus) => {
      let allowedLayers = bus.preferredLayers ?? ["top"]
      if (bus.preferredLayer !== undefined) {
        allowedLayers = [bus.preferredLayer]
      }
      return bus.connectionIds.map(
        (connectionId) => [connectionId, allowedLayers] as const,
      )
    }),
  )
  for (const breakoutPoint of output.breakoutPoints) {
    const sourceTrace = sourceTraceById.get(breakoutPoint.connectionId)
    if (!sourceTrace?.name) {
      throw new Error(`Missing source trace "${breakoutPoint.connectionId}"`)
    }
    const expectedConnection = DDR_CONNECTIONS.find(
      (candidate) => candidate.traceName === sourceTrace.name,
    )
    if (!expectedConnection) {
      throw new Error(`Missing expected connection "${sourceTrace.name}"`)
    }
    expect(
      allowedLayersByConnectionId.get(breakoutPoint.connectionId),
    ).toContain(breakoutPoint.layer)
  }
  for (const differentialPair of differentialPairInputs) {
    const [positiveConnection, negativeConnection] =
      differentialPair.connections
    const pairPoints = output.breakoutPoints.filter(
      (point) =>
        point.connectionId === positiveConnection.id ||
        point.connectionId === negativeConnection.id,
    )
    const pairLayer = pairPoints.find(
      (point) => point.connectionId === positiveConnection.id,
    )!.layer
    expect(new Set(pairPoints.map((point) => point.layer))).toEqual(
      new Set([pairLayer]),
    )
    for (const region of solverInput.regions) {
      const vertical = region.edge === "left" || region.edge === "right"
      const layerOrder = output.breakoutPoints
        .filter(
          (point) => point.regionId === region.id && point.layer === pairLayer,
        )
        .sort((first, second) => {
          if (vertical) return first.y - second.y
          return first.x - second.x
        })
        .map((point) => point.connectionId)
      expect(
        Math.abs(
          layerOrder.indexOf(positiveConnection.id) -
            layerOrder.indexOf(negativeConnection.id),
        ),
      ).toBe(1)
    }
  }

  const sourceTraceNameById = new Map(
    circuit.db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace.name]),
  )
  const connectionOrderByRegion = ["SOC_BREAKOUT", "RAM_BREAKOUT"].map(
    (pcbGroupName, regionIndex) => {
      const pcbGroup = circuit.db.pcb_group.getWhere({ name: pcbGroupName })
      if (!pcbGroup?.width) throw new Error(`Missing ${pcbGroupName} bounds`)
      const breakoutPoints = circuit.db.pcb_breakout_point
        .list()
        .filter((point) => point.pcb_group_id === pcbGroup.pcb_group_id)
        .sort((first, second) => first.y - second.y)
      expect(breakoutPoints).toHaveLength(DDR_CONNECTIONS.length)
      let facingX = pcbGroup.center.x - pcbGroup.width / 2
      if (regionIndex === 0) facingX = pcbGroup.center.x + pcbGroup.width / 2
      for (const breakoutPoint of breakoutPoints) {
        expect(breakoutPoint.x).toBeCloseTo(facingX, 3)
      }
      return breakoutPoints.map((breakoutPoint) =>
        sourceTraceNameById.get(breakoutPoint.source_trace_id!),
      )
    },
  )
  expect(connectionOrderByRegion[0]).toEqual(connectionOrderByRegion[1])

  const solvedSocPoints = solveCoordinatedWindingBreakoutPoints(socBreakout)
  expect(solvedSocPoints).not.toBeNull()
  expect(solvedSocPoints).toHaveLength(DDR_CONNECTIONS.length)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
