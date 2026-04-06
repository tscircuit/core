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

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('Trace selector ".J1 .A1"')
  expect(errors[0].message).toContain("multiple non-overlapping PCB pads")
  expect(errors[0].message).toContain('"J1.pin1"')
  expect(errors[0].message).toContain('"J1.pin2"')
})
