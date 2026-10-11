import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("one trace can render multiple independent pcb paths", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={18} height={12}>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={3} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={5} pcbY={-3} />
      <trace
        path={[".R1 > .pin2", ".R2 > .pin1", ".R3 > .pin1"]}
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPaths={[
          [".R1 > .pin2", { x: 5, y: 0 }],
          [{ x: 5, y: 0 }, ".R2 > .pin1"],
          [{ x: 5, y: 0 }, ".R3 > .pin1"],
        ]}
        thickness={0.35}
      />
      <pcbnotetext
        text="ONE TRACE / THREE PCB PATHS"
        pcbY={5}
        fontSize={0.45}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(3)
  expect(new Set(pcbTraces.map((trace) => trace.source_trace_id)).size).toBe(1)
  expect(pcbTraces.map((trace) => trace.route.length)).toEqual([2, 2, 2])
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
