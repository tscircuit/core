import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a complete saved fanout path with a pad via needs no follow-up routing", async () => {
  const { circuit } = getTestFixture()
  const path: FanoutTracePath = {
    connection: "U1.1",
    route: [
      {
        route_type: "via",
        x: 0,
        y: 0,
        from_layer: "top",
        to_layer: "bottom",
        via_diameter: 0.6,
        via_hole_diameter: 0.3,
      },
      { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "bottom" },
      { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "bottom" },
    ],
  }
  const autorouters: string[] = []
  circuit.on("autorouting:start", (event) =>
    autorouters.push(event.autorouterName!),
  )
  circuit.add(
    <board width={16} height={12}>
      <pcbnotetext
        pcbY={4}
        fontSize={0.5}
        text="Saved pad via + complete route; no solver"
      />
      <chip
        name="U1"
        pinLabels={{ pin1: "VIA_IN_PAD" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.8} height={0.8} shape="rect" />
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
            <smtpad portHints={["1"]} width={0.8} height={0.8} shape="rect" />
          </footprint>
        }
      />
      <autoroutingphase
        autorouter={{ preset: "fanout", allowViaInPad: true }}
        pcbTracePaths={[path]}
      />
      <trace from="U1.1" to="U2.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(autorouters).toEqual(["precomputed"])
  expect(circuit.db.pcb_via.list()).toEqual([
    expect.objectContaining({
      x: 0,
      y: 0,
      from_layer: "top",
      to_layer: "bottom",
      outer_diameter: 0.6,
      hole_diameter: 0.3,
    }),
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
