import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaLayerPortsBoard } from "tests/fixtures/via-layer-ports-board"

test("ordinary through vias expose inner2 and emit the requested copper", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(<ViaLayerPortsBoard />)
  await circuit.renderUntilSettled()
  let status = "FAIL"
  try {
    expect(circuit.db.pcb_via.list().map((via) => via.layers)).toEqual([
      ["top", "inner1", "inner2", "bottom"],
      ["top", "inner1", "inner2", "bottom"],
    ])
    expect(circuit.db.source_trace_not_connected_error.list()).toEqual([])
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    const route = circuit.db.pcb_trace.list()[0].route
    expect([route[0], route.at(-1)]).toMatchObject([
      { route_type: "wire", x: -2, y: 0, layer: "inner2", width: 0.2 },
      { route_type: "wire", x: 2, y: 0, layer: "inner2", width: 0.2 },
    ])
    expect(
      route.every(
        (point) =>
          point.route_type === "wire" &&
          point.layer === "inner2" &&
          point.width === 0.2,
      ),
    ).toBe(true)
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      layer: "inner2",
    })
    status = "PASS"
  } finally {
    // Optional actual-run evidence, never an expected snapshot baseline.
    if (process.env.VIA_PORT_EVIDENCE_DIR) {
      await Bun.write(
        `${process.env.VIA_PORT_EVIDENCE_DIR}/circuit.json`,
        JSON.stringify(circuit.getCircuitJson()),
      )
      await Bun.write(
        `${process.env.VIA_PORT_EVIDENCE_DIR}/assertion.json`,
        JSON.stringify({ status }),
      )
    }
  }
})
