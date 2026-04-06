import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous imported alias pin fails with a clear pcb trace error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="J1"
        pcbX={-4}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1", "A1"]}
              pcbX="-1mm"
              pcbY="0mm"
              width="0.6mm"
              height="0.6mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2", "A1"]}
              pcbX="1mm"
              pcbY="0mm"
              width="0.6mm"
              height="0.6mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".J1 .A1" to=".R1 .pin1" pcbStraightLine />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.pcb_trace_error.list()

  expect(errors).toMatchInlineSnapshot(`
    [
      {
        "error_type": "pcb_trace_error",
        "message": "Trace selector ".J1 .A1" resolved to "J1.pin1", but that target maps to multiple non-overlapping PCB pads: <smtpad(.pin1, .A1) />, <smtpad(.pin2, .A1) />. Use a raw pin selector like "J1.pin1" or "J1.pin2".",
        "pcb_component_ids": [],
        "pcb_port_ids": [
          "pcb_port_0",
        ],
        "pcb_trace_error_id": "pcb_trace_error_0",
        "pcb_trace_id": null,
        "source_trace_id": "source_trace_0",
        "type": "pcb_trace_error",
      },
    ]
  `)
})
