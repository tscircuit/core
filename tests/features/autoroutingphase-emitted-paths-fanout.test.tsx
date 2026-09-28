import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getPcbSvgPixelParity } from "tests/fixtures/get-pcb-svg-pixel-parity"

test("emitted fanout paths preserve escaped copper and allow follow-up routing", async () => {
  const board = (paths?: FanoutTracePath[]) => (
    <board width={20} height={12}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <autoroutingphase
        name="escape"
        phaseIndex={7}
        autorouter="fanout"
        pcbTracePaths={paths}
      />
      <trace from="R1.1" to="R2.1" routingPhaseIndex={7} />
      <pcbnotetext
        text="Exported fanout + automatic follow-up"
        pcbY={4}
        fontSize={0.5}
      />
    </board>
  )
  const { circuit } = getTestFixture()
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(board())
  await circuit.renderUntilSettled()
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(events[0]!.pcbTracePaths!.length).toBeGreaterThan(0)
  const { circuit: replay } = getTestFixture()
  const routers: string[] = []
  replay.on("autorouting:start", (event) => routers.push(event.autorouterName!))
  replay.add(board(JSON.parse(JSON.stringify(events[0]!.pcbTracePaths))))
  await replay.renderUntilSettled()
  expect(routers).toEqual(["precomputed", "tscircuit"])
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  // Only the escapes are saved; the follow-up router may choose different
  // copper for the remaining connection. Compare the exported stage itself.
  const savedTrace = replay.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id.startsWith("saved_phase_"))!
  const routedTraceIds = new Set(
    events[0]!.simpleRouteJson.traces!.map((trace) => trace.pcb_trace_id),
  )
  const escapes = events[0]!.pcbTracePaths!
  const originalEscapeJson = circuit
    .getCircuitJson()
    .filter((element) =>
      element.type === "pcb_trace"
        ? routedTraceIds.has(element.pcb_trace_id)
        : element.type === "pcb_via"
          ? escapes.some((path) =>
              path.route.some(
                (point) =>
                  point.route_type === "via" &&
                  Math.hypot(
                    Number(point.x) - element.x,
                    Number(point.y) - element.y,
                  ) < 1e-4,
              ),
            )
          : true,
    )
  const replayEscapeJson = replay
    .getCircuitJson()
    .filter((element) =>
      element.type === "pcb_trace"
        ? element.pcb_trace_id === savedTrace.pcb_trace_id
        : element.type === "pcb_via"
          ? escapes.some((path) =>
              path.route.some(
                (point) =>
                  point.route_type === "via" &&
                  Math.hypot(
                    Number(point.x) - element.x,
                    Number(point.y) - element.y,
                  ) < 1e-4,
              ),
            )
          : true,
    )
  expect(
    getPcbSvgPixelParity(
      convertCircuitJsonToPcbSvg(originalEscapeJson),
      convertCircuitJsonToPcbSvg(replayEscapeJson),
    ).foregroundParityPercent,
  ).toBeGreaterThanOrEqual(99.9)
  await expect(replay).toMatchPcbSnapshot(import.meta.path)
})
