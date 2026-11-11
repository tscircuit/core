import { beforeAll, expect, test } from "bun:test"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { runRemotePlaneRouting } from "tests/fixtures/run-remote-plane-routing"

let routingResult: Awaited<ReturnType<typeof runRemotePlaneRouting>>

beforeAll(async () => {
  routingResult = await runRemotePlaneRouting("solve-endpoint")
  const { circuit } = routingResult
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  for (const via of vias) {
    expect(via.layers).toEqual(getViaBoardLayers(4))
  }
})

test.failing(
  "remote solve reserves the unbroken inner1 plane while through vias reach inner2",
  () => {
    const { circuit, autorouterInput } = routingResult
    const wireLayers = circuit.db.pcb_trace
      .list()[0]!
      .route.filter((point) => point.route_type === "wire")
      .map((point) => point.layer)
    expect(wireLayers).not.toContain("inner1")
    expect(wireLayers).toContain("inner2")
    expect(
      autorouterInput.obstacles.some(
        (obstacle) =>
          obstacle.isCopperPour && obstacle.layers.includes("inner1"),
      ),
    ).toBe(true)
  },
)
