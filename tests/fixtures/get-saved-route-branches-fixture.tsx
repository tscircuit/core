import type { AutoroutingEndEvent } from "lib/events"
import type { FanoutTracePath } from "lib/index"
import type { Board } from "lib/components/normal-components/Board/Board"
import { createBasicAutorouter } from "./createBasicAutorouter"
import { getTestFixture } from "./get-test-fixture"

export type SavedRouteBranchCase =
  | "shared_pad"
  | "junction"
  | "spanning_connections"

export function getSavedRouteBranchesFixture({
  kind,
  paths,
}: {
  kind: SavedRouteBranchCase
  paths?: FanoutTracePath[]
}) {
  const { circuit } = getTestFixture()
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  const wire = (x: number, y: number) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.25,
    layer: "top" as const,
  })
  const routes =
    kind === "junction"
      ? [
          [wire(-5, 0), wire(-1, 0)],
          [wire(-1, 0), wire(1, 0)],
          [wire(1, 0), wire(5, 0)],
          [wire(0, 0), wire(0, 4)],
        ]
      : [
          [wire(-5, 0), wire(5, 0)],
          [wire(-5, 0), wire(-5, 2), wire(0, 4)],
        ]
  circuit.add(
    <board width={16} height={12} routeRemaining={false}>
      {[
        { name: "A", x: -5, y: 0 },
        { name: "B", x: 5, y: 0 },
        { name: "C", x: 0, y: 4 },
      ].map(({ name, x, y }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={y}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.8} height={0.8} shape="rect" />
            </footprint>
          }
        />
      ))}
      <trace from="A.1" to="B.1" />
      <trace from={kind === "spanning_connections" ? "B.1" : "A.1"} to="C.1" />
      <autoroutingphase
        pcbTracePaths={paths}
        autorouter={{
          algorithmFn: createBasicAutorouter(async (input) =>
            routes.map((route, routeIndex) => ({
              type: "pcb_trace",
              pcb_trace_id: `branch_${routeIndex}`,
              connection_name: input.connections[0]!.name,
              route,
            })),
          ),
        }}
      />
      <pcbnotetext
        text={
          kind === "junction"
            ? "Junctions: shared trunk, mid-segment branch"
            : "Two paths from A; A, B and C share one net"
        }
        pcbY={-3}
        fontSize={0.5}
      />
      <pcbnotetext
        text="Save and replay must preserve this copper"
        pcbY={-4}
        fontSize={0.5}
      />
    </board>,
  )
  return { circuit, events, routes }
}

export function getSavedRouteBranchCopper(
  circuit: ReturnType<typeof getTestFixture>["circuit"],
) {
  return circuit.db.pcb_trace.list().map((trace) =>
    trace.route.map((point) => {
      if (point.route_type !== "wire") throw new Error("Expected a wire route")
      return {
        route_type: point.route_type,
        x: point.x,
        y: point.y,
        width: point.width,
        layer: point.layer,
      }
    }),
  )
}

export function addSavedRouteBranchStatus(
  circuit: ReturnType<typeof getTestFixture>["circuit"],
  text: string,
) {
  const board = circuit.firstChild as Board
  board.add(<pcbnotetext text={text} pcbY={-4.9} fontSize={0.45} />)
}
