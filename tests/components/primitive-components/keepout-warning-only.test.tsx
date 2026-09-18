import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { PcbKeepoutWithWarningOnly } from "lib/utils/circuit-json/pcb-keepout-with-warning-only"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warning-only keepouts remain visible and checked but do not block routing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={18} autorouter="default">
      <pcbnotetext
        text="ROUTE THROUGH ADVISORY KEEPOUTS"
        pcbY={7}
        fontSize={0.6}
      />
      <testpoint name="TP1" footprintVariant="pad" pcbX={-12} pcbY={0} />
      <testpoint name="TP2" footprintVariant="pad" pcbX={12} pcbY={0} />
      <trace from=".TP1 > .pin1" to=".TP2 > .pin1" />
      <keepout shape="rect" width={4} height={8} pcbX={-4} warningOnly />
      <keepout shape="circle" radius={3} pcbX={4} warningOnly />
      <keepout
        shape="rect"
        width={2}
        height={2}
        pcbX={-4}
        pcbY={-6}
        warningOnly={false}
      />
      <keepout shape="circle" radius={1} pcbX={4} pcbY={-6} />
      <pcbnotetext
        text="NORMAL KEEPOUTS STILL BLOCK"
        pcbY={-8}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list() as PcbKeepoutWithWarningOnly[]
  expect(keepouts.map((keepout) => keepout.warning_only)).toEqual([
    true,
    true,
    false,
    undefined,
  ])
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: keepouts[0].subcircuit_id,
    subcircuitComponent: circuit.firstChild!,
  })
  for (const keepout of keepouts) {
    if (keepout.shape === "outline")
      throw new Error("Unexpected outline keepout")
    const obstacle = simpleRouteJson.obstacles.find(
      (obstacle) =>
        obstacle.center.x === keepout.center.x &&
        obstacle.center.y === keepout.center.y,
    )
    expect(Boolean(obstacle)).toBe(!keepout.warning_only)
  }
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  const keepoutErrors = (
    await runAllRoutingChecks(circuit.getCircuitJson())
  ).filter(
    (error) =>
      error.type === "pcb_trace_error" &&
      error.pcb_trace_error_id.includes("pcb_keepout"),
  )
  expect(keepoutErrors.length).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
