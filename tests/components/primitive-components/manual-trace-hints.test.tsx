import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual trace hints correctly change trace routes", async () => {
  const { circuit, logSoup } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      autorouter="sequential-trace"
      manualEdits={{
        manual_trace_hints: [
          {
            pcb_port_selector: ".R1 > .pin2",
            offsets: [
              {
                x: -1,
                y: 5,
                via: true,
              },
              {
                x: 1,
                y: 5,
                via: true,
              },
            ],
          },
        ],
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <led name="LED1" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_trace.list().length).toBe(1)

  const traceRoute = circuit.db.pcb_trace.list()[0].route

  expect(traceRoute.map((p) => ("layer" in p ? p.layer : ""))).toContain(
    "bottom",
  )

  expect(circuit.selectAll("tracehint").length).toBe(1)

  expect(circuit.db.pcb_trace_hint.list().length).toBe(1)

  expect(circuit.db.pcb_trace_hint.list()[0].pcb_port_id).toBeTruthy()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
