import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multilayer trace with tracehint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={15} pcbY={15} />
      <trace path={["R1.p2", "R2.p1"]}>
        <tracehint x={10} y={10} layer="bottom" />
      </trace>
    </board>
  )

  circuit.render()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(1)

  const trace = traces[0]
  expect(trace.route).toHaveLength(3)
  expect(trace.route[0].layer).toBe("top")
  expect(trace.route[1].layer).toBe("bottom")
  expect(trace.route[2].layer).toBe("top")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
