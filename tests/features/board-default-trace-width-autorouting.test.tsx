import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getWireWidths = (circuit: any): number[] =>
  circuit.db.pcb_trace
    .list()
    .flatMap((t: any) =>
      t.route
        .filter((p: any) => p.route_type === "wire")
        .map((p: any) => p.width),
    )

// Note: the defaultTraceWidth case is covered by
// tests/components/primitive-components/trace-default-trace-width.test.tsx

test("board nominalTraceWidth sets autorouted trace width", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" nominalTraceWidth="0.25mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.25)
  }
})

test("explicit trace thickness takes precedence over board defaultTraceWidth", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" defaultTraceWidth="0.3mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" thickness="0.5mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.5)
  }
})

test("autorouted trace width still defaults to 0.15mm when no width props are set", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.15)
  }
})
