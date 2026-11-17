import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSavedRouteBranchCopper } from "tests/fixtures/get-saved-route-branches-fixture"

test("branched paths replay group placement at every quarter turn on both layers", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const createCircuit = (paths?: FanoutTracePath[]) => {
        const { circuit } = getTestFixture()
        const events: AutoroutingEndEvent[] = []
        circuit.on("autorouting:end", (event) => events.push(event))
        circuit.add(
          <board width={24} height={24} routeRemaining={false}>
            <pcbnotetext
              text={`Branches: ${layer}, rotation ${rotation}`}
              pcbY={10}
              fontSize={0.5}
            />
            <group
              subcircuit
              name="local"
              pcbX={3}
              pcbY={2}
              pcbRotation={rotation}
            >
              {[
                { name: "A", x: -5, y: -1 },
                { name: "B", x: 4, y: 1 },
                { name: "C", x: 0, y: 5 },
              ].map(({ name, x, y }) => (
                <chip
                  key={name}
                  name={name}
                  pcbX={x}
                  pcbY={y}
                  layer={layer}
                  pinLabels={{ pin1: name }}
                  footprint={
                    <footprint>
                      <smtpad
                        portHints={["1"]}
                        shape="rect"
                        width={0.8}
                        height={0.8}
                      />
                    </footprint>
                  }
                />
              ))}
              <trace from="A.1" to="B.1" />
              <trace from="B.1" to="C.1" />
              <autoroutingphase
                pcbTracePaths={paths}
                autorouter={{
                  algorithmFn: createBasicAutorouter(async (input) => {
                    // Use the emitted pad positions, not a restatement of the placement transform.
                    const [a, b, c] = circuit.db.pcb_port.list()
                    const junction = {
                      x: (a!.x + b!.x) / 2,
                      y: (a!.y + b!.y) / 2,
                    }
                    const wire = (point: { x: number; y: number }) => ({
                      route_type: "wire" as const,
                      x: point.x,
                      y: point.y,
                      layer,
                      width: 0.25,
                    })
                    return [
                      [a!, junction],
                      [junction, b!],
                      [junction, c!],
                    ].map((points, routeIndex) => ({
                      type: "pcb_trace",
                      pcb_trace_id: `branch_${routeIndex}`,
                      connection_name: input.connections[0]!.name,
                      route: points.map(wire),
                    }))
                  }),
                }}
              />
            </group>
          </board>,
        )
        return { circuit, events }
      }
      const original = createCircuit()
      await original.circuit.renderUntilSettled()
      expect(original.events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
      const replay = createCircuit(
        JSON.parse(JSON.stringify(original.events[0]!.pcbTracePaths)),
      )
      await replay.circuit.renderUntilSettled()
      expect(replay.circuit.db.pcb_autorouting_error.list()).toEqual([])
      const expected = getSavedRouteBranchCopper(original.circuit)
      const actual = getSavedRouteBranchCopper(replay.circuit)
      expect(actual).toHaveLength(expected.length)
      for (const [routeIndex, route] of actual.entries()) {
        expect(route).toHaveLength(expected[routeIndex]!.length)
        for (const [pointIndex, point] of route.entries()) {
          const expectedPoint = expected[routeIndex]![pointIndex]!
          expect(point.x).toBeCloseTo(expectedPoint.x, 8)
          expect(point.y).toBeCloseTo(expectedPoint.y, 8)
          expect(point.layer).toBe(expectedPoint.layer)
          expect(point.width).toBe(expectedPoint.width)
        }
      }
      await expect(replay.circuit).toMatchPcbSnapshot(
        import.meta.path.replace(".test.tsx", `-${layer}-${rotation}.test.tsx`),
      )
    }
  }
})
