import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ownership reaches a chain of portless pieces imported from the middle outward", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={8} schLayout={{ layoutMode: "none" }}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} />
      <trace from="R1.pin2" to="R2.pin1" />
      <autoroutingphase
        algorithmFn={createBasicAutorouter(async (input) => {
          const [start, end] = input.connections[0].pointsToConnect
          const pieceCount = 5
          // Board-world points in mm (+X right, +Y up), on top copper.
          const points = Array.from({ length: pieceCount + 1 }, (_, index) => ({
            route_type: "wire" as const,
            x: start.x + ((end.x - start.x) * index) / pieceCount,
            y: start.y + ((end.y - start.y) * index) / pieceCount,
            layer: "top",
            width: 0.2,
          }))
          const pieces: SimplifiedPcbTrace[] = Array.from(
            { length: pieceCount },
            (_, index) => ({
              type: "pcb_trace",
              pcb_trace_id: `piece_${index}`,
              route: [points[index], points[index + 1]],
            }),
          )
          // The center cannot be resolved until its two neighbors acquire
          // ownership from the pad-connected outer pieces.
          return [pieces[2], pieces[1], pieces[3], pieces[0], pieces[4]]
        })}
      />
      <pcbnotetext
        pcbY={2.5}
        fontSize={0.55}
        text="Five pieces, center imported first"
      />
      <pcbnotetext
        pcbY={-2.5}
        fontSize={0.5}
        text="One connected path, zero errors"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(5)
  expect(traces.map((trace) => trace.source_trace_id)).toEqual(
    Array(5).fill(circuit.db.source_trace.list()[0].source_trace_id),
  )
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: false,
    showSolderPaste: false,
  })
})
