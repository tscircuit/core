import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit trace maxLength overrides the inferred decoupling limit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} />
      <resistor name="R_GND" resistance="0ohm" footprint="0402" pcbX={3.9} />
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-3}
        pinLabels={{
          8: "VBAT",
        }}
        pinAttributes={{
          VBAT: { requiresPower: true },
        }}
      />
      <trace
        name="POWER_TO_DECOUPLING"
        from=".U1 > .VBAT"
        to=".C1 > .1"
        maxLength="5.5mm"
      />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".R_GND > .1" to="net.GND" />
      <pcbnotetext text="Explicit trace maxLength: 5.5mm" pcbX={0} pcbY={7} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const powerToDecouplingTrace = circuit.db.source_trace.getWhere({
    name: "POWER_TO_DECOUPLING",
  })

  expect(powerToDecouplingTrace?.max_length).toBe(5.5)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(
    circuit.db.pcb_trace.getWhere({
      source_trace_id: powerToDecouplingTrace!.source_trace_id,
    }),
  ).toBeDefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
