import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getPcbSvgPixelParity } from "tests/fixtures/get-pcb-svg-pixel-parity"

test("emitted routes replay translated and rotated groups on both layers", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const board = (paths?: FanoutTracePath[]) => (
        <board width={24} height={24}>
          <pcbnotetext
            text={`Export/replay: ${layer}, rotation ${rotation}`}
            pcbY={10}
            fontSize={0.55}
          />
          <group
            subcircuit
            name="local"
            pcbX={3}
            pcbY={2}
            pcbRotation={rotation}
          >
            <chip
              name="U1"
              pcbX={-2}
              pcbY={-1}
              layer={layer}
              pinLabels={{ pin1: "START" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    width={0.6}
                    height={0.6}
                    shape="rect"
                  />
                </footprint>
              }
            />
            <chip
              name="U2"
              pcbX={4}
              pcbY={1}
              layer={layer}
              pinLabels={{ pin1: "END" }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["1"]}
                    width={0.6}
                    height={0.6}
                    shape="rect"
                  />
                </footprint>
              }
            />
            <autoroutingphase pcbTracePaths={paths} />
            <trace from="U1.1" to="U2.1" />
          </group>
        </board>
      )
      const { circuit } = getTestFixture()
      const events: AutoroutingEndEvent[] = []
      circuit.on("autorouting:end", (event) => events.push(event))
      circuit.add(board())
      await circuit.renderUntilSettled()
      expect(events).toHaveLength(1)
      expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
      const paths = JSON.parse(JSON.stringify(events[0]!.pcbTracePaths))
      const { circuit: replay } = getTestFixture()
      replay.add(board(paths))
      await replay.renderUntilSettled()
      expect(replay.db.pcb_autorouting_error.list()).toEqual([])
      const originalSvg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson())
      const replaySvg = convertCircuitJsonToPcbSvg(replay.getCircuitJson())
      expect(
        getPcbSvgPixelParity(originalSvg, replaySvg).foregroundParityPercent,
      ).toBeGreaterThanOrEqual(99.9)
      // The local start point must land on the actual port after replay, even at 90/270 degrees.
      const trace = replay.db.pcb_trace.list()[0]!
      const firstWire = trace.route.find(
        (point) => point.route_type === "wire",
      )!
      const port = replay.db.pcb_port
        .list()
        .find(
          (port) =>
            Math.hypot(port.x - firstWire.x, port.y - firstWire.y) < 1e-4,
        )
      expect(port).toBeDefined()
      await expect(replay).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
}, 30_000)
