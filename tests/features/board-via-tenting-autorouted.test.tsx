import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouted vias inherit board defaults without overwriting manual exceptions", async () => {
  for (const [defaultViaTenting, top, bottom] of [
    [undefined, undefined, undefined],
    [true, true, true],
    [false, false, false],
    ["top_tented", true, false],
    ["bottom_tented", false, true],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={20}
        height={10}
        defaultViaTenting={defaultViaTenting}
        autorouter={{
          algorithmFn: createBasicAutorouter(async (input) => {
            const connection = input.connections[0]
            const [start, end] = connection.pointsToConnect
            const width = input.minTraceWidth
            return [
              {
                type: "pcb_trace",
                pcb_trace_id: "tenting_route",
                connection_name: connection.name,
                route: [
                  { route_type: "wire", ...start, width },
                  { route_type: "wire", x: 0, y: 0, layer: "top", width },
                  {
                    route_type: "via",
                    x: 0,
                    y: 0,
                    from_layer: "top",
                    to_layer: "bottom",
                  },
                  { route_type: "wire", x: 0, y: 0, layer: "bottom", width },
                  { route_type: "wire", ...end, width },
                ],
              },
            ]
          }),
        }}
      >
        <subcircuit name="Nested">
          <testpoint name="A" footprintVariant="pad" pcbX={-4} layer="top" />
          <testpoint name="B" footprintVariant="pad" pcbX={4} layer="bottom" />
          <trace from="A.pin1" to="B.pin1" />
          <via name="Exposed" pcbY={3} tented={false} />
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    const routed = vias.filter((via) => via.pcb_trace_id)
    expect(routed).toHaveLength(1)
    expect([routed[0].tented_on_top, routed[0].tented_on_bottom]).toEqual([
      top,
      bottom,
    ])
    const manual = vias.find((via) => !via.pcb_trace_id)!
    expect([manual.tented_on_top, manual.tented_on_bottom]).toEqual([
      false,
      false,
    ])
  }
})
