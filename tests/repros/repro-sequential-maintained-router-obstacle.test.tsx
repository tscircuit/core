import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sequential routing avoids a through-board obstacle with the maintained router", async () => {
  const { circuit } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })
  circuit.add(
    <board width="30mm" height="20mm" autorouter="sequential_trace">
      <resistor name="R1" resistance="1k" footprint="2512" pcbX={-7} />
      <resistor name="R2" resistance="1k" footprint="2512" pcbX={7} />
      <hole name="BLOCKER" diameter="2mm" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" thickness={0.4} />
      <pcbnotetext
        text="Sequential route must avoid the central hole"
        pcbY={-4}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const records = circuit.getCircuitJson()
  expect(records.filter((r) => r.type.endsWith("_error"))).toEqual([])
  const trace = records.find((r) => r.type === "pcb_trace")!
  expect(trace).toBeDefined()
  const wires = trace.route.filter((p) => p.route_type === "wire")
  expect(wires.length).toBeGreaterThan(2)
  for (let i = 1; i < wires.length; i++) {
    const a = wires[i - 1],
      b = wires[i]
    expect(a.width).toBeGreaterThanOrEqual(0.4)
    expect(b.width).toBeGreaterThanOrEqual(0.4)
    if (a.layer !== b.layer) continue
    const dx = b.x - a.x,
      dy = b.y - a.y
    const t = Math.max(
      0,
      Math.min(1, -(a.x * dx + a.y * dy) / (dx * dx + dy * dy || 1)),
    )
    expect(Math.hypot(a.x + t * dx, a.y + t * dy)).toBeGreaterThanOrEqual(
      1 + Math.max(a.width, b.width) / 2 + 0.8 - 1e-6,
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
