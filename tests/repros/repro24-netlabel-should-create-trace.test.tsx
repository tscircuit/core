import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Ensure that netlabels create traces that the autorouter can use

test("netlabel autorouting creates pcb traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" schX={3} pcbX={3} />
      <capacitor
        name="C1"
        capacitance="1000pF"
        footprint="0402"
        schX={-3}
        pcbX={-3}
      />
      <netlabel
        net="VCC"
        connectsTo={["R1.pin1", "R1.pin2", "C1.pin1", "C1.pin2"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // There should be some connection between R1.pin2 and C1.pin1 that goes
  // through across x=0
  expect(
    "\n" +
      circuit.db.pcb_trace
        .list()
        .map((t) => t.route.map((r) => `(${r.x}, ${r.y})`).join("->"))
        .join("\n"),
  ).toMatchInlineSnapshot(`
    "
    (-3.5, 0)->(-2.5, 0)->(-2.5, 0)
    (2.5, 0)->(3.5, 0)->(3.5, 0)
    (2.5, 0)->(-2.5, 0)->(-2.5, 0)"
  `)

  expect(circuit.db.source_trace.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})
