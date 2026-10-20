import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("raises a board nominal trace width that is below the board minimum", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="12mm"
      autorouter="auto_local"
      minTraceWidth="0.5mm"
      nominalTraceWidth="0.25mm"
    >
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
      <pcbnotetext
        text="nominal: 0.25 mm; board minimum: 0.5 mm; expected routed width: 0.5 mm"
        pcbY={4}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(0)
  for (const trace of pcbTraces) {
    for (const point of trace.route) {
      if (point.route_type === "wire") expect(point.width).toBe(0.5)
    }
  }
  expect(
    circuit.db.source_property_ignored_warning
      .list()
      .map((warning) => warning.message),
  ).toEqual([
    "nominalTraceWidth (0.25mm) is below minTraceWidth (0.5mm); autorouted traces will use 0.5mm",
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
