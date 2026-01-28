import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("loads and renders footprint from path starting with ./ (relative path)", async () => {
  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: "http://localhost:3020/api/files/static",
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (_url: string) => {
            return {
              footprintCircuitJson: kicadModJson,
            }
          },
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        footprint="./node_modules/kicad-libraries/footprints/Espressif.pretty/ESP32-S2-MINI-1.kicad_mod"
        name="U1"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e: any) => e.type.includes("error"))

  expect(errors).toMatchInlineSnapshot(`[]`)
})
