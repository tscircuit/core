import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a routed inferred decoupling trace emits the generic too-long warning", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="6mm">
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
      <trace from=".U1 > .VCC" to=".C1 > .1" pcbStraightLine />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const warnings = circuit.db.pcb_trace_too_long_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].maximum_trace_length).toBe(1)
  expect(warnings[0].actual_trace_length).toBeGreaterThan(1)
})
