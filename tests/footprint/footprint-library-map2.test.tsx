import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

test("footprint library map 2", async () => {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          const url = `${footprintServerUrl}/${footprintName}.circuit.json`
          const res = await fetch(url)
          return { footprintCircuitJson: await res.json() }
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        pcbX={-5}
      />
      <resistor name="R2" resistance="20k" footprint="0402" pcbX={5} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_trace = circuit
    .getCircuitJson()
    .filter((el) => el.type === "pcb_trace")
  expect(pcb_trace.length).toBe(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
