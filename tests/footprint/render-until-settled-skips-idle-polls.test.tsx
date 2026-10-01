import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("renderUntilSettled waits for a footprint without repeating idle render cycles", async () => {
  let resolveFootprint!: (result: { footprintCircuitJson: any[] }) => void
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () =>
          new Promise<{ footprintCircuitJson: any[] }>((resolve) => {
            resolveFootprint = resolve
          }),
      },
    },
  })
  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
      />
    </board>,
  )
  let renderCalls = 0
  const render = circuit.render.bind(circuit)
  circuit.render = () => {
    renderCalls++
    render()
  }
  const settled = circuit.renderUntilSettled()
  try {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const callsWhileWaiting = renderCalls
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(circuit.isDoneRendering()).toBe(false)
    expect(renderCalls).toBe(callsWhileWaiting)
  } finally {
    resolveFootprint({ footprintCircuitJson: external0402Footprint })
  }
  await settled
  expect(circuit.isDoneRendering()).toBe(true)
  expect(circuit.getCircuitJson().some((e) => e.type === "pcb_smtpad")).toBe(
    true,
  )
})
