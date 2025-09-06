import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestKicadFootprintServer } from "tests/fixtures/get-test-kicad-footprint-server"

test("kicad footprint 1", async () => {
  const { kicadFootprintServerUrl } = getTestKicadFootprintServer()
  const { circuit } = getTestFixture({
    platform: {
      kicadFootprintServerUrl: kicadFootprintServerUrl,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        pcbX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
