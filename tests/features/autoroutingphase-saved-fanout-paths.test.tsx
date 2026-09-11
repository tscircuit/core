import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase continues saved fanout escapes from their exit layer", async () => {
  const { circuit } = getTestFixture()
  const paths: FanoutTracePath[] = [
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
  ]
  const phaseInputs: SimpleRouteJson[] = []
  const autorouters: string[] = []
  circuit.on("autorouting:start", (event) => {
    phaseInputs.push(event.simpleRouteJson)
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
  expect(phaseInputs[1]!.traces ?? []).toHaveLength(0)
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
