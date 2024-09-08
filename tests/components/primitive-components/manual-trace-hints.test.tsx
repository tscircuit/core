import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { layout } from "@tscircuit/layout"

test("manual trace hints correctly change trace routes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      layout={layout().manualEdits({
        manual_trace_hints: [
          {
            pcb_port_selector: ".R1 > .pin2",
            offsets: [
              {
                x: 0,
                y: 5,
                via: false,
              },
            ],
          },
        ],
      })}
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

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
