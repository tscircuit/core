import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import type { FanoutTracePath } from "lib/index"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSavedRouteBranchCopper } from "tests/fixtures/get-saved-route-branches-fixture"

test("saved junctions retain source identity in every path order", async () => {
  const wire = (x: number, y: number) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.25,
    layer: "top" as const,
  })
  const routes = [
    [wire(-5, 0), wire(-1, 0)],
    [wire(-1, 0), wire(1, 0)],
    [wire(1, 0), wire(5, 0)],
    [wire(0, 0), wire(0, 4)],
  ]
  const fixture = (namedNet: boolean, paths?: FanoutTracePath[]) => {
    const { circuit } = getTestFixture()
    const events: AutoroutingEndEvent[] = []
    circuit.on("autorouting:end", (event) => events.push(event))
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
                <smtpad
                  portHints={["1"]}
                  width={0.8}
                  height={0.8}
                  shape="rect"
                />
              </footprint>
            }
          />
        ))}
        {namedNet ? (
          <>
            <net name="SIGNAL" />
            <trace from="A.1" to="net.SIGNAL" />
            <trace from="B.1" to="net.SIGNAL" />
            <trace from="C.1" to="net.SIGNAL" />
          </>
        ) : (
          <>
            <trace from="A.1" to="B.1" />
            <trace from="A.1" to="C.1" />
          </>
        )}
        <autoroutingphase
          pcbTracePaths={paths}
          autorouter={{
            algorithmFn: createBasicAutorouter(async (input) =>
              routes.map((route, index) => ({
                type: "pcb_trace",
                pcb_trace_id: `branch_${index}`,
                connection_name: input.connections[0]!.name,
                route,
              })),
            ),
          }}
        />
        <pcbnotetext
          text="Trunk-first replay: every segment retains its source"
          pcbY={-3}
          fontSize={0.45}
        />
      </board>,
    )
    return { circuit, events }
  }
  const permutations = (indices: number[]): number[][] =>
    indices.length === 0
      ? [[]]
      : indices.flatMap((first) =>
          permutations(indices.filter((index) => index !== first)).map(
            (rest) => [first, ...rest],
          ),
        )
  for (const namedNet of [false, true]) {
    const original = fixture(namedNet)
    await original.circuit.renderUntilSettled()
    expect(original.events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
    const paths = original.events[0]!.pcbTracePaths!
    for (const order of permutations([1, 3, 0, 2])) {
      const replay = fixture(
        namedNet,
        order.map((index) => paths[index]!),
      )
      await replay.circuit.renderUntilSettled()
      expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(getSavedRouteBranchCopper(replay.circuit)).toEqual(
        order.map((index) => routes[index]!),
      )
      const { db } = replay.circuit
      const netKey = db.source_trace.list()[0]!.subcircuit_connectivity_map_key
      for (const trace of db.pcb_trace.list()) {
        expect(trace.source_trace_id).toBeDefined()
        const source =
          db.source_trace.get(trace.source_trace_id!) ??
          db.source_net.get(trace.source_trace_id!)
        expect(source?.subcircuit_connectivity_map_key).toBe(netKey)
        // Shared copper in a named net must not inherit one local leg's rules.
        if (namedNet)
          expect(trace.source_trace_id).toBe(
            db.source_net.list()[0]!.source_net_id,
          )
      }
      if (order.join() === "1,3,0,2")
        await expect(replay.circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
