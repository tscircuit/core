import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved fanout paths preserve bends and hand off to global routing", async () => {
  const { circuit } = getTestFixture()
  const paths: FanoutTracePath[] = [
    {
      connection: "U1.1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
        { route_type: "wire", x: 3, y: 1, width: 0.2, layer: "top" },
      ],
    },
  ]
  const original = JSON.stringify(paths)
  circuit.add(
    <board width={24} height={20}>
      <fanout name="saved" pcbTracePaths={paths}>
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["1"]}
                pcbX={0}
                pcbY={0}
                width={0.6}
                height={0.6}
                shape="rect"
              />
            </footprint>
          }
          pinLabels={{ pin1: "SIGNAL" }}
        />
      </fanout>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={8} pcbY={1} />
      <trace from="U1.1" to="R1.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(JSON.stringify(paths)).toBe(original)
  const savedTrace = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id.startsWith("saved_fanout_"))!
  expect(savedTrace.route).toMatchObject(paths[0]!.route)
  const exit = circuit.db.pcb_breakout_point.list()[0]!
  expect(exit).toMatchObject({ x: 3, y: 1, layer: "top" })
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" && point.x === 1 && point.y === 1,
        ),
      ),
  ).toBe(true)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
