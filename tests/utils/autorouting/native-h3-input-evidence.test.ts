import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import {
  compareNativeH3InitialInputs,
  compareNativeH3PhaseRequests,
  type NativeH3InputEvidence,
} from "tests/fixtures/h3-routing-phase-intent/input-evidence"

test("paired H3 evidence keeps initial copper exact while allowing different later generated copper", () => {
  const baseline: NativeH3InputEvidence = {
    fixtureSha256: "fixture",
    boardTsxSha256: "native_board",
    nativePartSha256: "native_part",
    initialCopper: [{ type: "pcb_via", pcb_via_id: "supplied_via", x: 0, y: 0, layers: ["top", "bottom"], outer_diameter: 0.6, hole_diameter: 0.3 }],
    initialGeometry: [
      {
        type: "pcb_board",
        pcb_board_id: "board",
        center: { x: 0, y: 0 },
        width: 6,
        height: 6,
        num_layers: 2,
        thickness: 1.6,
        material: "fr4",
      },
    ],
    initialPhaseInput: {
      layerCount: 2,
      minTraceWidth: 0.1,
      minViaEdgeToPadEdgeClearance: 0.2,
      bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 },
      obstacles: [
        {
          type: "rect",
          obstacleId: "native_pad",
          circuitJsonMetadata: { pcb_smtpad_id: "native_pad" },
          center: { x: -1, y: 1 },
          width: 0.4,
          height: 0.4,
          layers: ["top"],
          connectedTo: ["signal"],
        },
      ],
      connections: [
        {
          name: "signal",
          nominalTraceWidth: 0.12,
          pointsToConnect: [
            { x: -1, y: 1, layer: "top" },
            { x: 1, y: 1, layer: "top" },
          ],
        },
      ],
      traces: [
        {
          type: "pcb_trace",
          pcb_trace_id: "supplied",
          connection_name: "existing",
          route: [
            { route_type: "wire", x: -1, y: -1, layer: "top", width: 0.1 },
            { route_type: "wire", x: 1, y: -1, layer: "top", width: 0.1 },
          ],
        },
      ],
    },
  }
  const same = structuredClone(baseline)
  expect(
    Object.values(
      compareNativeH3InitialInputs({ baseline, consumer: same }),
    ).every(Boolean),
  ).toBe(true)
  const changedPhysical = structuredClone(baseline)
  const via = changedPhysical.initialCopper.filter((element) => element.type === "pcb_via")[0]!
  via.outer_diameter = 0.7
  expect(compareNativeH3InitialInputs({ baseline, consumer: changedPhysical }).initialCopperMatches).toBe(false)
  const changedSupplied = structuredClone(baseline)
  changedSupplied.initialPhaseInput.traces![0]!.route[0] = {
    route_type: "wire",
    x: -2,
    y: -1,
    layer: "top",
    width: 0.1,
  }
  expect(
    compareNativeH3InitialInputs({ baseline, consumer: changedSupplied })
      .initialPhaseInputMatches,
  ).toBe(false)
  const generated = structuredClone(baseline.initialPhaseInput.traces![0]!)
  generated.pcb_trace_id = "generated_earlier"
  generated.connection_name = "earlier_phase"
  const before: AutoroutingStartEvent = {
    type: "autorouting:start",
    subcircuit_id: "board",
    componentDisplayName: "Native comparison",
    phaseName: "byte1",
    simpleRouteJson: {
      ...baseline.initialPhaseInput,
      traces: [...baseline.initialPhaseInput.traces!, generated],
    },
  }
  const after = structuredClone(before)
  after.simpleRouteJson.traces![1]!.route[0] = {
    route_type: "wire",
    x: -2,
    y: -1,
    layer: "top",
    width: 0.1,
  }
  after.simpleRouteJson.obstacles.push({
    type: "rect",
    obstacleId: "earlier_generated_via",
    center: { x: 1, y: -1 },
    width: 0.6,
    height: 0.6,
    layers: ["top", "bottom"],
    connectedTo: ["earlier_phase"],
  })
  after.simpleRouteJson.obstacles[0]!.connectedTo.push("new_equivalent_trace")
  const comparePhase = (consumer: AutoroutingStartEvent) =>
    compareNativeH3PhaseRequests({
      baseline: before,
      consumer,
      initialBaseline: baseline.initialPhaseInput,
      initialConsumer: same.initialPhaseInput,
    })
  expect(
    comparePhase(after),
  ).toBe(true)
  const movedPad = structuredClone(after)
  movedPad.simpleRouteJson.obstacles[0]!.center.x += 0.1
  expect(comparePhase(movedPad)).toBe(false)
  const changedLayer = structuredClone(after)
  changedLayer.simpleRouteJson.obstacles[0]!.layers = ["bottom"]
  expect(comparePhase(changedLayer)).toBe(false)
  const removedPad = structuredClone(after)
  removedPad.simpleRouteJson.obstacles.shift()
  expect(comparePhase(removedPad)).toBe(false)
  const changedOwner = structuredClone(after)
  changedOwner.simpleRouteJson.obstacles[0]!.connectedTo = ["foreign_signal"]
  expect(comparePhase(changedOwner)).toBe(false)
  const changedRule = structuredClone(after)
  changedRule.simpleRouteJson.minViaEdgeToPadEdgeClearance = 0.3
  expect(
    comparePhase(changedRule),
  ).toBe(false)
  const changedRequest = structuredClone(after)
  changedRequest.simpleRouteJson.connections[0]!.nominalTraceWidth = 0.15
  expect(
    comparePhase(changedRequest),
  ).toBe(false)
  const moved = structuredClone(baseline)
  const board = moved.initialGeometry.filter(
    (element) => element.type === "pcb_board",
  )[0]!
  board.center.x = 1
  expect(
    compareNativeH3InitialInputs({ baseline, consumer: moved })
      .initialGeometryMatches,
  ).toBe(false)
})
