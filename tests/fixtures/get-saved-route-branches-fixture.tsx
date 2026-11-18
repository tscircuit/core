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
    <board width={20} height={18} routeRemaining={false}>
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
            ? "SAVE A BRANCHED ROUTE"
            : kind === "shared_pad"
              ? "REPLAY TWO PATHS FROM THE SAME PAD"
              : "SAVE ROUTES SPANNING TWO CONNECTIONS"
        }
        pcbY={7.5}
        fontSize={0.55}
      />
      <pcbnotetext
        text={
          kind === "shared_pad"
            ? "Expected: two copper paths, A-B and A-C"
            : "Copper is valid. The test is whether Core can save it."
        }
        pcbY={6.5}
        fontSize={0.4}
      />
      <pcbnotetext text="A.1" pcbX={-5} pcbY={-0.8} fontSize={0.45} />
      <pcbnotetext text="B.1" pcbX={5} pcbY={-0.8} fontSize={0.45} />
      <pcbnotetext text="C.1" pcbY={5} fontSize={0.45} />
      {kind === "junction" ? (
        <>
          <pcbnotetext text="T-junction" pcbX={3.8} pcbY={2.5} fontSize={0.4} />
          <pcbnoteline x1={2.4} y1={2.2} x2={0.2} y2={0.2} />
          <pcbnoterect width={2.4} height={0.7} />
          <pcbnoteline x1={0} y1={-0.5} x2={0} y2={-1.6} />
          <pcbnotetext
            text="Trunk: no pad at either end"
            pcbY={-2.2}
            fontSize={0.4}
          />
        </>
      ) : (
        <pcbnotetext
          text={
            kind === "shared_pad"
              ? 'Both saved paths select "A.1"'
              : "Logical requests: A-B and B-C; physical routes: A-B and A-C"
          }
          pcbY={-2.2}
          fontSize={0.4}
        />
      )}
      <pcbnoteline x1={-9} y1={-3.2} x2={9} y2={-3.2} />
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
  {
    operation,
    actualCount,
    expectedCount,
    error,
  }: {
    operation: "save" | "replay"
    actualCount: number
    expectedCount: number
    error?: string
  },
) {
  const board = circuit.firstChild as Board
  const failed = Boolean(error) || actualCount !== expectedCount
  const color = failed ? "#ff8080" : "#68e0a0"
  const result = `${operation.toUpperCase()} ${failed ? "FAILED" : "OK"}`
  const countLabel =
    operation === "save" ? "Saved paths" : "Replayed copper traces"
  const consequence =
    operation === "save"
      ? failed
        ? "No saved routes were produced. Replay cannot start."
        : "All routes were saved; replay preserves the same copper."
      : failed
        ? "Core rejected the saved paths. All copper is missing."
        : "Both saved paths were accepted; all copper is restored."
  // Wrap the actual Core diagnostic without replacing it with a hand-written cause.
  const diagnosticLines = (
    `Core error: ${error ?? "none"}`.match(/.{1,64}(?:\s|$)/g) ?? []
  ).map((line) => line.trim())
  const annotations = [
    <pcbnotetext text={result} pcbY={-4.2} fontSize={0.7} color={color} />,
    <pcbnotetext
      text={`${countLabel}: ${actualCount} / ${expectedCount}`}
      pcbY={-5.2}
      fontSize={0.5}
      color={color}
    />,
    <pcbnotetext text={consequence} pcbY={-6.2} fontSize={0.4} color={color} />,
    ...diagnosticLines.map((text, lineIndex) => (
      <pcbnotetext
        text={text}
        pcbY={-7.2 - lineIndex * 0.55}
        fontSize={0.36}
        color={color}
      />
    )),
  ]
  for (const annotation of annotations) board.add(annotation)
}
