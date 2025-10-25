import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

test("trace pcbPath selectors work with kicad footprints", async () => {
  const { circuit } = getTestFixture()

  circuit.platform = {
    footprintLibraryMap: {
      kicad: async (footprintName: string) => {
        return {
          footprintCircuitJson: kicadModJson,
        }
      },
    },
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
        pcbX={-3}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
        pcbX={3}
        pcbY={0}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2", { x: 0, y: 4 }, "R2.pin1"]}
        thickness="0.5mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const selectorErrors = circuit.db.pcb_trace_error
    .list()
    .filter((e) => e.message?.includes("Could not resolve pcbPath selector"))
  expect(selectorErrors.length).toBe(0)

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  expect(pcbTrace.route.length).toBeGreaterThanOrEqual(3)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
