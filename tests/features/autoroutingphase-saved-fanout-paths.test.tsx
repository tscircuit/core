import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase continues saved fanout escapes from their exit layer", async () => {
  const { circuit } = getTestFixture()
  const paths = [
    {
      connection: "U1.1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
        {
          route_type: "via",
          x: 3,
          y: 1,
          from_layer: "top",
          to_layer: "bottom",
          via_diameter: 0.6,
          via_hole_diameter: 0.3,
        },
      ],
    },
  ] satisfies FanoutTracePath[]
  const phaseInputs: SimpleRouteJson[] = []
  const autorouters: string[] = []
  circuit.on("autorouting:start", (event) => {
    phaseInputs.push(structuredClone(event.simpleRouteJson))
    autorouters.push(event.autorouterName!)
  })
  circuit.add(
    <board width={24} height={16}>
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="Saved escape to via; router continues on bottom"
      />
      <chip
        name="U1"
        pinLabels={{ pin1: "ESCAPE" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={8}
        pcbY={1}
        layer="bottom"
        pinLabels={{ pin1: "DESTINATION" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <solderjumper
        name="JP1"
        footprint="solderjumper2_bridged12"
        pcbX={-5}
        pcbY={-4}
      />
      <autoroutingphase autorouter="fanout" pcbTracePaths={paths} />
      <trace from="U1.1" to="U2.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(autorouters).toEqual(["precomputed", "tscircuit"])
  expect(phaseInputs[1]!.connections[0]!.pointsToConnect).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ x: 3, y: 1, layer: "bottom" }),
      expect.objectContaining({ x: 8, y: 1 }),
    ]),
  )
  expect(
    phaseInputs[1]!.connections.every((connection) =>
      connection.pointsToConnect.every((point) => !("layers" in point)),
    ),
  ).toBe(true)
  expect(phaseInputs[1]!.traces).toHaveLength(2)
  const bridge = circuit.db.pcb_trace
    .list()
    .find((trace) => !trace.source_trace_id)!
  const bridgeInput = phaseInputs[1]!.traces!.find(
    (trace) => trace.pcb_trace_id === bridge.pcb_trace_id,
  )!
  expect(bridgeInput.route[0]!.route_type).toBe("through_obstacle")
  expect(
    phaseInputs[1]!.obstacles.some(
      (obstacle) => obstacle.connectedTo[0] === bridge.pcb_trace_id,
    ),
  ).toBe(false)
  const savedInput = phaseInputs[1]!.traces!.find((trace) =>
    trace.pcb_trace_id.startsWith("saved_phase_"),
  )!
  expect(savedInput.route.slice(0, 2)).toEqual(paths[0]!.route.slice(0, 2))
  expect(savedInput.route).toContainEqual(paths[0]!.route[2]!)
  expect(
    phaseInputs[1]!.obstacles.some(
      (obstacle) => obstacle.connectedTo[0] === savedInput.connection_name,
    ),
  ).toBe(false)
  const saved = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id.startsWith("saved_phase_"))!
  expect(saved.route.slice(0, 2)).toMatchObject(paths[0]!.route.slice(0, 2))
  expect(saved.route).toContainEqual(
    expect.objectContaining(paths[0]!.route[2]!),
  )
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
