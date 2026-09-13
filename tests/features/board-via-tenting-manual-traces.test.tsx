import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual trace vias use the owning board's default through nested subcircuits", async () => {
  for (const [defaultViaTenting, top, bottom] of [
    [undefined, undefined, undefined],
    [true, true, true],
    [false, false, false],
    ["top_tented", true, false],
    ["bottom_tented", false, true],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={12} height={8} defaultViaTenting={defaultViaTenting}>
        <subcircuit name="Nested">
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
          <trace
            from=".R1 > .pin1"
            to=".R2 > .pin1"
            pcbPath={[
              { x: 0, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
            ]}
          />
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(1)
    expect([vias[0].tented_on_top, vias[0].tented_on_bottom]).toEqual([
      top,
      bottom,
    ])
    expect(vias[0].pcb_trace_id).toBeDefined()
  }
})
