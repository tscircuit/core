import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

it("should correctly load and render a KiCad footprint from a given URL", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            expect(url).toBe(
              `https://gitlab.com/kicad/libraries/kicad-footprints/-/raw/master/Resistor_SMD.pretty/R_0402_1005Metric.kicad_mod`,
            )
            return {
              footprintCircuitJson: kicadModJson,
            }
          },
        },
      },
    },
  })

  circuit.add(
    <board>
      <chip
        footprint={`https://gitlab.com/kicad/libraries/kicad-footprints/-/raw/master/Resistor_SMD.pretty/R_0402_1005Metric.kicad_mod`}
        name="U2"
      />
    </board>,
  )

  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
