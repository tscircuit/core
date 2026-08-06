import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an impossible inferred limit uses the existing autorouting error path", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="10mm"
      height="6mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <chip
        name="U1"
        pcbX={-2}
        pinLabels={{ pin1: "VCC" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        pcbX={2}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={-0.5}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="0.5mm"
              height="0.5mm"
              pcbX={0.5}
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
      <trace from=".U1 > .VCC" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()[0].max_length).toBe(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_too_long_warning.list()).toHaveLength(0)
  const errors = circuit.db.pcb_autorouting_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("cannot be satisfied")
})
