import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual trace vias inherit the board tenting through nested subcircuits", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} defaultViaTenting="bottom_tented">
      <pcbnotetext
        text="Manual route | Bottom tented"
        pcbY={3}
        fontSize={0.5}
      />
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

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    default_via_tented_on_top: false,
    default_via_tented_on_bottom: true,
  })
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  const via = circuit.db.pcb_via.list()[0]
  expect(via.pcb_trace_id).toBe(circuit.db.pcb_trace.list()[0].pcb_trace_id)
  expect(via.tented_on_top).toBeUndefined()
  expect(via.tented_on_bottom).toBeUndefined()
  const routeVia = circuit.db.pcb_trace
    .list()[0]
    .route.find((point) => point.route_type === "via")
  expect(routeVia).toBeDefined()
  expect(routeVia!.tented_on_top).toBeUndefined()
  expect(routeVia!.tented_on_bottom).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "bottom",
  })
})
