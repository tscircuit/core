import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A bundle of nets leaving a ROW of SMD lands (U1) and turning the corner into a COLUMN of
// lands (U2). pcbComb="rowToColumn" draws each as a fixed straight → 45° → straight comb:
// the perpendicular escape clears the rectangular lands, and N of them nest into an even fan.
const N = 12
const P = 1.27
const cx = -15
const cy = ((N - 1) * P) / 2

const rowPads = Array.from({ length: N }, (_, i) => (
  <smtpad
    shape="rect"
    layer="top"
    portHints={[`p${i + 1}`]}
    pcbX={`${(i * P + cx).toFixed(3)}mm`}
    pcbY={`${cy.toFixed(3)}mm`}
    width="0.6mm"
    height="1.0mm"
  />
))
const colPads = Array.from({ length: N }, (_, j) => (
  <smtpad
    shape="rect"
    layer="top"
    portHints={[`q${j + 1}`]}
    pcbX="15mm"
    pcbY={`${(-j * P + cy - 1).toFixed(3)}mm`}
    width="1.0mm"
    height="0.6mm"
  />
))

test("pcbComb routes a row→column bundle as a clean comb", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="36mm" height="20mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={<footprint>{rowPads}</footprint>}
      />
      <chip
        name="U2"
        pcbX={0}
        pcbY={0}
        footprint={<footprint>{colPads}</footprint>}
      />
      {Array.from({ length: N }, (_, i) => (
        <trace
          from={`.U1 > .p${i + 1}`}
          to={`.U2 > .q${N - i}`}
          pcbComb="rowToColumn"
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(N)
  // every comb is escape → 45° → land: four wire points, one layer, no via
  for (const t of traces) {
    const wires = t.route.filter((r) => r.route_type === "wire")
    expect(wires).toHaveLength(4)
    expect(t.route.some((r) => r.route_type === "via")).toBe(false)
    expect(new Set(wires.map((w: any) => w.layer)).size).toBe(1)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
