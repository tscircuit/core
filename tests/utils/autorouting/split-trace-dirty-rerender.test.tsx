import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dirty PCB trace rerender replaces every materialized split section", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layers={2}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          const connection = simpleRouteJson.connections[0]!
          const [start] = connection.pointsToConnect
          // Deliberately keep the second solver section detached from source
          // ports and give it a non-source connection name. Source-based
          // replacement cannot identify that section, isolating exact physical
          // PCB trace ID ownership during a dirty rerender.
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "split_trace",
              connection_name: connection.name,
              route: [
                {
                  route_type: "wire",
                  x: start!.x,
                  y: start!.y,
                  width: 0.15,
                  layer: "top",
                },
                {
                  route_type: "wire",
                  x: -1,
                  y: 0,
                  width: 0.15,
                  layer: "top",
                },
              ],
            },
            {
              type: "pcb_trace",
              pcb_trace_id: "split_trace",
              connection_name: "intentionally_detached_section",
              route: [
                {
                  route_type: "wire",
                  x: 1,
                  y: 0,
                  width: 0.15,
                  layer: "top",
                },
                {
                  route_type: "wire",
                  x: 2,
                  y: 0,
                  width: 0.15,
                  layer: "top",
                },
                {
                  route_type: "via",
                  x: 2,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: 2,
                  y: 0,
                  width: 0.15,
                  layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: 1.5,
                  y: 0,
                  width: 0.15,
                  layer: "bottom",
                },
              ],
            },
          ]
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbY={0}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.38}
        text="DIRTY RERENDER — DETACHED SPLIT OWNERSHIP"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={1}
        fontSize={0.26}
        text="INTENTIONAL DETACHED OUTPUT"
      />
      <pcbnotetext pcbX={-2} pcbY={-1} fontSize={0.3} text="SOURCE SECTION" />
      <pcbnotetext
        pcbX={1.5}
        pcbY={-1}
        fontSize={0.3}
        text="DETACHED SECTION + VIA"
      />
      <pcbnoterect
        pcbX={2}
        pcbY={0}
        width={0.8}
        height={0.8}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.1}
        isStrokeDashed
      />
      <pcbnotetext pcbX={2} pcbY={2} fontSize={0.32} text="ONE OWNED VIA" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Group
  board._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_component
      .list()
      .filter((component) => component.name.startsWith("__autoplaced_jumper_")),
  ).toEqual([])
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.map((trace) => trace.pcb_trace_id)).toEqual([
    "split_trace",
    "split_trace__section_1",
  ])
  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias).toHaveLength(1)
  expect(pcbVias[0]?.pcb_trace_id).toBe("split_trace__section_1")
  expect(
    pcbTraces
      .find((trace) => trace.pcb_trace_id === pcbVias[0]?.pcb_trace_id)
      ?.route.some(
        (point) => point.route_type === "via" && point.x === 2 && point.y === 0,
      ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
