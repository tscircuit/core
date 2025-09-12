import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

test("footprint library map 4 - pcbPack", async () => {
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
    <board width="20mm" height="10mm" pcbPack>
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
      />
      <resistor
        name="R2"
        resistance="20k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
      />
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
