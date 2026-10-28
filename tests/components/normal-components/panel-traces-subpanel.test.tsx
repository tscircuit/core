import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel traces connect ports across boards through nested subpanels", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={60} height={30} pcbX={15} pcbY={10} panelizationMethod="none">
      <subpanel
        name="inner"
        layoutMode="grid"
        col={2}
        pcbX={5}
        pcbY={2}
        panelizationMethod="none"
      >
        <board name="B1" width={10} height={10}>
          <resistor name="R1" resistance="1k" footprint="0805" />
        </board>
        <board name="B2" width={10} height={10}>
          <resistor name="R2" resistance="1k" footprint="0805" />
        </board>
        <trace
          name="panel_link"
          from=".B1 .R1 .pin2"
          to=".B2 .R2 .pin1"
          pcbStraightLine
        />
      </subpanel>
    </panel>,
  )
  await circuit.renderUntilSettled()
  const panel = circuit.db.pcb_panel.list()[0]!
  const sourceTrace = circuit.db.source_trace.list()[0]!
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(1)
  expect(traces[0]!.pcb_panel_id).toBe(panel.pcb_panel_id)
  expect(traces[0]!.source_trace_id).toBe(sourceTrace.source_trace_id)
  expect(sourceTrace.connected_source_port_ids).toHaveLength(2)
  const ports = circuit.db.pcb_port
    .list()
    .filter((p) =>
      sourceTrace.connected_source_port_ids.includes(p.source_port_id!),
    )
  expect(ports[0]!.x).toBeLessThan(ports[1]!.x)
  const route = traces[0]!.route
  expect(route[0]).toMatchObject({ x: ports[0]!.x, y: ports[0]!.y })
  expect(route.at(-1)).toMatchObject({ x: ports[1]!.x, y: ports[1]!.y })
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
