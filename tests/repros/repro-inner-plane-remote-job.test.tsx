import { expect, test } from "bun:test"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { runRemotePlaneRouting } from "tests/fixtures/run-remote-plane-routing"

test("repro: remote jobs lose plane intent and route signal wires on inner1", async () => {
  const { circuit, autorouterInput } = await runRemotePlaneRouting("job")

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const wireLayers = new Set(
    circuit.db.pcb_trace
      .list()
      .flatMap((trace) =>
        trace.route.flatMap((point) =>
          point.route_type === "wire" ? [point.layer] : [],
        ),
      ),
  )
  // Record the defect; the stacked fix reserves inner1 and routes on inner2.
  expect(wireLayers.has("inner1")).toBe(true)
  expect(wireLayers.has("inner2")).toBe(false)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  for (const via of circuit.db.pcb_via.list()) {
    expect(via.layers).toEqual(getViaBoardLayers(4))
  }
  expect(
    autorouterInput.obstacles.some(
      (obstacle) => obstacle.isCopperPour && obstacle.layers.includes("inner1"),
    ),
  ).toBe(false)
})
