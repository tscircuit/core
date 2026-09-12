import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase preserves complete saved routes before later routing", async () => {
  const { circuit } = getTestFixture()
  const paths: FanoutTracePath[] = [
    {
      connection: "U1.SAVED_START",
      route: [
        { route_type: "wire", x: "-4mm", y: 0, width: "0.2mm", layer: "top" },
        { route_type: "wire", x: -2, y: 2, width: 0.2, layer: "top" },
        {
          route_type: "via",
          x: 0,
          y: 2,
          from_layer: "top",
          to_layer: "bottom",
          via_diameter: "0.6mm",
          via_hole_diameter: "0.3mm",
        },
        { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "bottom" },
        { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "bottom" },
      ],
    },
  ]
  const original = JSON.stringify(paths)
  const autorouters: string[] = []
  circuit.on("autorouting:start", (event) =>
    autorouters.push(event.autorouterName!),
  )
  circuit.add(
    <board width={18} height={14}>
      <pcbnotetext
        pcbY={5}
        fontSize={0.6}
        text="Saved bends + via; automatic route below"
      />
      <chip
        name="U1"
        pcbX={-4}
        pinLabels={{ pin1: "SAVED_START" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={4}
        layer="bottom"
        pinLabels={{ pin1: "SAVED_END" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <resistor
        name="R1"
        pcbX={-4}
        pcbY={-4}
        resistance="1k"
        footprint="0402"
      />
      <resistor name="R2" pcbX={4} pcbY={-4} resistance="1k" footprint="0402" />
      <autoroutingphase
        phaseIndex={0}
        connection="U1.1"
        pcbTracePaths={paths}
      />
      <trace from="U1.1" to="U2.1" />
      <trace from="R1.1" to="R2.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(autorouters[0]).toBe("precomputed")
  expect(autorouters).toHaveLength(2)
  const saved = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id.startsWith("saved_phase_"))!
  expect(saved.route).toMatchObject([
    { route_type: "wire", x: -4, y: 0, width: 0.2, layer: "top" },
    ...paths[0]!.route.slice(1, 2),
    { route_type: "wire", x: 0, y: 2, layer: "top", width: 0.2 },
    {
      route_type: "via",
      x: 0,
      y: 2,
      from_layer: "top",
      to_layer: "bottom",
      via_diameter: 0.6,
      via_hole_diameter: 0.3,
    },
    { route_type: "wire", x: 0, y: 2, layer: "bottom", width: 0.2 },
    ...paths[0]!.route.slice(3),
  ])
  expect(JSON.stringify(paths)).toBe(original)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
