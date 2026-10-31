import { expect, test } from "bun:test"
import { getLabeledPcbSvg } from "tests/fixtures/get-labeled-pcb-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// The branch ends on the middle of the trunk, with no PCB port at the junction.
const algorithmFn = createBasicAutorouter(async (input) => {
  const connection = input.connections[0]!
  const points = [...connection.pointsToConnect].sort((a, b) => a.x - b.x)
  const wire = (x: number, y: number) => ({
    route_type: "wire" as const,
    x,
    y,
    layer: "top",
    width: 0.2,
  })
  return [
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "branch",
      connection_name: connection.name,
      route: [wire(points[1]!.x, points[1]!.y), wire(0, 0)],
    },
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "trunk",
      connection_name: connection.name,
      route: [
        wire(points[0]!.x, points[0]!.y),
        wire(points[2]!.x, points[2]!.y),
      ],
    },
  ]
})

const board = (paths?: FanoutTracePath[]) => (
  <board width={16} height={12} autorouter={{ algorithmFn }}>
    {[
      { name: "LEFT", x: -5, y: 0 },
      { name: "BRANCH", x: 0, y: 3 },
      { name: "RIGHT", x: 5, y: 0 },
    ].map(({ name, x, y }) => (
      <chip
        key={name}
        name={name}
        pcbX={x}
        pcbY={y}
        pinLabels={{ pin1: "SIGNAL" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
        connections={{ SIGNAL: "net.SIGNAL" }}
      />
    ))}
    <autoroutingphase pcbTracePaths={paths} />
    <pcbnotetext
      pcbY={-3}
      fontSize={0.5}
      text="Save/replay a branch landing on a routed trunk"
    />
  </board>
)

test("phase paths export and replay a non-port routing junction", async () => {
  const { circuit } = getTestFixture()
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(board())
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(events[0]!.pcbTracePaths).toHaveLength(2)
  const { circuit: replay } = getTestFixture()
  const routers: string[] = []
  replay.on("autorouting:start", (event) => routers.push(event.autorouterName!))
  replay.add(board(JSON.parse(JSON.stringify(events[0]!.pcbTracePaths))))
  await replay.renderUntilSettled()
  expect(routers).toEqual(["precomputed"])
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(replay.db.pcb_trace.list()).toHaveLength(2)
  await expect(
    stackSvgsHorizontally(
      [
        getLabeledPcbSvg(circuit.getCircuitJson(), "ORIGINAL ROUTED COPPER", [
          "Three pads share one net; the branch joins the trunk at (0, 0).",
          `Observed: ${circuit.db.pcb_trace.list().length} routed traces; ${events[0]!.pcbTracePaths!.length} saved paths.`,
          "The exporter orders the trunk before its branch.",
        ]),
        getLabeledPcbSvg(replay.getCircuitJson(), "REPLAYED SAVED PATHS", [
          `Observed: ${replay.db.pcb_trace.list().length} traces; ${replay.db.pcb_autorouting_error.list().length} routing errors.`,
          `Router: ${routers.join(", ")}. Copper must match the original.`,
          "The same-layer junction is accepted without an extra PCB port.",
        ]),
      ],
      { gap: 20, normalizeSize: false },
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
