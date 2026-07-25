import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { grid } from "@tscircuit/math-utils"

test("repro47P: 3x3 switch matrix with diodes", async () => {
  const { circuit } = getTestFixture()
  const rows = 3
  const cols = 3

  circuit.add(
    <board width="60mm" height="60mm" schMaxTraceDistance={30} routingDisabled>
      <pinheader
        name="J1"
        pinCount={6}
        doubleRow
        pitch="2.54mm"
        showSilkscreenPinLabels
        pinLabels={["ROW0", "ROW1", "ROW2", "COL0", "COL1", "COL2"]}
        pcbX={-20}
        pcbY={0}
        connections={{
          ROW0: "net.ROW0",
          ROW1: "net.ROW1",
          ROW2: "net.ROW2",
          COL0: "net.COL0",
          COL1: "net.COL1",
          COL2: "net.COL2",
        }}
      />

      {grid({
        rows,
        cols,
        xSpacing: 14,
        ySpacing: 14,
        offsetX: 8,
        offsetY: 0,
      }).map((cell) => {
        const n = cell.index + 1
        const row = cell.row
        const col = cell.col
        const swName = `SW${n}`
        const dName = `D${n}`

        return (
          <group key={n}>
            <pushbutton
              name={swName}
              footprint="pushbutton"
              pcbX={cell.center.x}
              pcbY={cell.center.y}
              schX={cell.center.x / 4}
              schY={cell.center.y / 6}
            />
            <diode
              name={dName}
              footprint="0402"
              variant="standard"
              pcbX={cell.center.x - 5}
              pcbY={cell.center.y}
              schX={cell.center.x / 4 - 1.2}
              schY={cell.center.y / 6}
            />
            <trace from={`net.ROW${row}`} to={`.${dName} > .anode`} />
            <trace from={`.${dName} > .cathode`} to={`.${swName} > .pin1`} />
            <trace from={`.${swName} > .pin3`} to={`net.COL${col}`} />
          </group>
        )
      })}
    </board>,
  )

  await circuit.render()

  const diodeToSwitchConnectivityKeys = circuit.db.source_trace
    .list()
    .filter((sourceTrace) => sourceTrace.display_name?.includes("cathode"))
    .map((sourceTrace) => sourceTrace.subcircuit_connectivity_map_key)
  const diodeToSwitchTraces = circuit.db.schematic_trace
    .list()
    .filter((schematicTrace) =>
      diodeToSwitchConnectivityKeys.includes(
        schematicTrace.subcircuit_connectivity_map_key,
      ),
    )

  expect(diodeToSwitchTraces).toHaveLength(9)
  expect(
    diodeToSwitchTraces.every((schematicTrace) => {
      const firstEdge = schematicTrace.edges[0]!
      const lastEdge = schematicTrace.edges[schematicTrace.edges.length - 1]!
      const minimumOrthogonalLength =
        Math.abs(lastEdge.to.x - firstEdge.from.x) +
        Math.abs(lastEdge.to.y - firstEdge.from.y)
      const routedLength = schematicTrace.edges.reduce(
        (length, edge) =>
          length +
          Math.abs(edge.to.x - edge.from.x) +
          Math.abs(edge.to.y - edge.from.y),
        0,
      )
      return Math.abs(routedLength - minimumOrthogonalLength) < 1e-6
    }),
  ).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
