import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crystal traces warn above the default or configured maximum length", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        footprint="0402"
        pcbX={-8}
        pcbY={4}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={8} pcbY={4} />
      <trace from=".Y1 > .pin1" to=".R1 > .pin1" pcbStraightLine />

      <crystal
        name="Y2"
        frequency="12MHz"
        loadCapacitance="10pF"
        footprint="0402"
        pcbX={-8}
        pcbY={-4}
        maxTraceLength="20mm"
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} pcbY={-4} />
      <trace from=".Y2 > .pin1" to=".R2 > .pin1" pcbStraightLine />
    </board>,
  )

  circuit.render()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces.map((trace) => trace.max_length)).toEqual([10, 20])

  const warnings = circuit.db.pcb_trace_too_long_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    source_trace_id: sourceTraces[0].source_trace_id,
    maximum_trace_length: 10,
  })
  expect(warnings[0].actual_trace_length).toBeGreaterThan(10)
})
