import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a saved branch claims only connections covered by its copper", async () => {
  const { circuit } = getTestFixture()
  const stages: AutoroutingStartEvent[] = []
  circuit.on("autorouting:start", (event) => stages.push(event))
  circuit.add(
    <board width={18} height={12} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-5} />
      <testpoint name="B" footprintVariant="pad" pcbX={1} />
      <testpoint name="C" footprintVariant="pad" pcbX={-1} pcbY={3} />
      <testpoint name="D" footprintVariant="pad" pcbX={5} pcbY={3} />
      <trace from="A.1" to="B.1" />
      <trace from="B.1" to="C.1" />
      <trace from="C.1" to="D.1" />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          {
            connection: "A.1",
            route: [
              { route_type: "wire", x: -5, y: 0, width: 0.25, layer: "top" },
              { route_type: "wire", x: 1, y: 0, width: 0.25, layer: "top" },
            ],
          },
          {
            connection: "A.1",
            route: [
              { route_type: "wire", x: -5, y: 0, width: 0.25, layer: "top" },
              { route_type: "wire", x: -1, y: 3, width: 0.25, layer: "top" },
            ],
          },
        ]}
      />
      <pcbnotetext
        text="Saved copper joins A, B and C"
        pcbY={5}
        fontSize={0.45}
      />
      <pcbnotetext
        text="C–D routes in the remaining phase"
        pcbY={-3}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(stages[0]?.autorouterName).toBe("precomputed")
  expect(
    stages.map(({ simpleRouteJson }) =>
      simpleRouteJson.connections.map(({ pointsToConnect }) =>
        pointsToConnect.map(({ x, y }) => [x, y]),
      ),
    ),
  ).toEqual([
    [
      [
        [-5, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [-1, 3],
      ],
    ],
    [
      [
        [-1, 3],
        [5, 3],
      ],
    ],
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
