import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("async footprint library map can complete after last render pass", async () => {
  let resolveFootprint:
    | ((result: { footprintCircuitJson: any[] }) => void)
    | undefined

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

  expect(circuit.isDoneRendering()).toBe(false)
  circuit.render()

  while (!circuit.isDoneRendering()) {
    await Promise.resolve()
    circuit.render()
    resolveFootprint?.({ footprintCircuitJson: external0402Footprint })
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  circuit.emit("renderComplete")

  expect(circuit.isDoneRendering()).toBe(true)
  const circuitJsonAtRenderComplete = circuit.getCircuitJson()
  expect(
    circuitJsonAtRenderComplete.some((el) => el.type === "pcb_smtpad"),
  ).toBe(true)
})
