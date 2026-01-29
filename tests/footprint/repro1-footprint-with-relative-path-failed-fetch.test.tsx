import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("should properly resolve ./ relative paths to full URLs with projectBaseUrl", async () => {
  let receivedUrl: string | null = null

  const { circuit } = getTestFixture({
    platform: {
      projectBaseUrl: "http://localhost:3020/api/files/static",
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            receivedUrl = url
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

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e: any) => e.type.includes("error"))

  // The ./ path should be normalized and combined with projectBaseUrl
  expect(errors).toEqual([])
  expect(receivedUrl).toMatchInlineSnapshot(
    `"http://localhost:3020/api/files/static/node_modules/kicad-libraries/footprints/Espressif.pretty/ESP32-S2-MINI-1.kicad_mod"`,
  )
})
