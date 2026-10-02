import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const board = (
  rotation: number,
  layer: "top" | "bottom",
  paths?: FanoutTracePath[],
) => (
  <board
    width={16}
    height={12}
    layers={4}
    routeRemaining={false}
    minTraceWidth={0.1}
    minViaPadDiameter={0.4}
    minViaHoleDiameter={0.15}
  >
    <fanout
      pcbRotation={rotation}
      pcbX={2}
      pcbY={-1}
      autorouter="dogbone"
      fanoutRoutingLayers={["inner2"]}
      pcbTracePaths={paths}
    >
      <chip
        layer={layer}
        name="U1"
        connections={{
          pin1: "net.SIGNAL",
          pin2: "net.VCC",
          pin3: "net.GND",
          pin4: "net.DATA",
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              shape="circle"
              radius={0.25}
              pcbX={0}
              pcbY={0}
            />
            <smtpad
              portHints={["2"]}
              shape="circle"
              radius={0.25}
              pcbX={1}
              pcbY={0}
            />
            <smtpad
              portHints={["3"]}
              shape="circle"
              radius={0.25}
              pcbX={0}
              pcbY={1}
            />
            <smtpad
              portHints={["4"]}
              shape="circle"
              radius={0.25}
              pcbX={1}
              pcbY={1}
            />
          </footprint>
        }
      />
    </fanout>
    <pcbnotetext
      pcbY={4}
      text="Replayed dogbones from edited phase artifact"
      fontSize={0.3}
    />
  </board>
)

test("dogbone phase exports editable fanout-local paths including power nets", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const events: AutoroutingEndEvent[] = []
      circuit.on("autorouting:end", (event) => events.push(event))
      circuit.add(board(rotation, layer))
      await circuit.renderUntilSettled()
      expect(events).toHaveLength(1)
      expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
      const paths = events[0]!.pcbTracePaths!
      expect(paths).toHaveLength(4)
      const edited = paths.map((path) => ({
        ...path,
        route: path.route.map((point) =>
          point.route_type === "wire" ? { ...point, width: 0.11 } : point,
        ),
      }))
      const { circuit: replay } = getTestFixture()
      replay.add(board(rotation, layer, edited))
      await replay.renderUntilSettled()
      expect(
        replay.getCircuitJson().filter((e) => e.type.endsWith("_error")),
      ).toEqual([])
      expect(replay.db.pcb_via.list()).toHaveLength(4)
      expect(replay.db.pcb_trace.list()).toHaveLength(4)
      const copperPoints = (c: typeof circuit) =>
        c.db.pcb_trace.list().flatMap((trace) =>
          trace.route
            .filter((p) => p.route_type !== "through_pad")
            .map((p) => ({
              x: p.x,
              y: p.y,
              route_type: p.route_type,
            })),
        )
      const originalPoints = copperPoints(circuit)
      const replayedPoints = copperPoints(replay)
      expect(replayedPoints).toHaveLength(originalPoints.length)
      for (const [index, point] of replayedPoints.entries()) {
        expect(point.route_type).toBe(originalPoints[index]!.route_type)
        expect(point.x).toBeCloseTo(originalPoints[index]!.x, 8)
        expect(point.y).toBeCloseTo(originalPoints[index]!.y, 8)
      }
      await expect(replay).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
}, 20_000)
