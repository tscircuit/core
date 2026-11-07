import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("through-hole via components expose inner-layer source and PCB ports on multilayer boards", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true

  circuit.add(
    <board width={20} height={12} layers={4} routeRemaining={false}>
      <via
        name="VA"
        pcbX={-2}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <via
        name="VB"
        pcbX={2}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <trace
        from="VA.inner2"
        to="VB.inner2"
        thickness={0.2}
        pcbPath={["VA.inner2", "VB.inner2"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias).toHaveLength(2)
  for (const via of pcbVias) {
    expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    expect((via as any).pcb_port_ids).toHaveLength(4)
  }

  expect(circuit.db.source_port.list()).toHaveLength(8)
  expect(circuit.db.pcb_port.list()).toHaveLength(8)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(1)
  const wirePoints = traces[0]!.route.filter((pt) => pt.route_type === "wire")
  expect(wirePoints.length).toBeGreaterThanOrEqual(2)
  for (const pt of wirePoints) {
    if (pt.route_type === "wire") {
      expect(pt.layer).toBe("inner2")
    }
  }
})
