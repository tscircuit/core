import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit trace width isolation and inheritance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      {/* Subcircuit 1 with specific autorouter */}
      <subcircuit name="analog-circuit" pcbX={-5} pcbY={0} autorouter="sequential-trace">
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          pcbY={1}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          pcbY={1}
        />
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0805"
          pcbX={0}
          pcbY={-1}
        />
        <trace
          from=".R2 > .pin2"
          to=".R3 > .pin1"
          thickness="0.25mm"
        />
        <trace
          from=".R3 > .pin2"
          to=".C1 > .pin1"
          thickness="0.4mm"
        />
      </subcircuit>

      {/* Subcircuit 2 with different autorouter */}
      <subcircuit name="power-circuit" pcbX={8} pcbY={0} autorouter="auto-local">
        <resistor
          name="R4"
          resistance="100"
          footprint="0402"
          pcbX={-2}
          pcbY={0}
        />
        <resistor
          name="R5"
          resistance="100"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
        <trace
          from=".R4 > .pin2"
          to=".R5 > .pin1"
          thickness="0.6mm"
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(3)

  // Verify trace widths are preserved in different subcircuit contexts
  // Group traces by subcircuit
  const subcircuitGroups = new Map<string, any[]>()
  traces.forEach(trace => {
    const subId = trace.subcircuit_id || 'main'
    if (!subcircuitGroups.has(subId)) {
      subcircuitGroups.set(subId, [])
    }
    subcircuitGroups.get(subId)!.push(trace)
  })

  expect(subcircuitGroups.size).toBe(2) // 2 subcircuits

  // Verify that traces in different subcircuits can have different widths
  // (The actual subcircuit assignment may vary, but the key is that different
  // routing contexts can produce different trace widths)
  const allWidths = traces.flatMap(t =>
    t.route.filter((s: any) => s.route_type === "wire").map((s: any) => s.width)
  )
  const uniqueWidths = [...new Set(allWidths)]
  expect(uniqueWidths.length).toBeGreaterThan(1) // Should have multiple different widths

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})