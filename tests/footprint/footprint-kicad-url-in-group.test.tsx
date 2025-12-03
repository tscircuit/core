import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadModJson from "tests/fixtures/assets/R_0402_1005Metric.json" with {
  type: "json",
}

test("chip with kicad url footprint renders inside group", async () => {
  let loadCalled = false
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (url: string) => {
            expect(url).toBe("https://cdn.example.com/footprint.kicad_mod")
            loadCalled = true
            return { footprintCircuitJson: kicadModJson }
          },
        },
      },
    },
  })

  circuit.add(
    <board>
      <group>
        <chip
          name="U1"
          footprint="https://cdn.example.com/footprint.kicad_mod"
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(loadCalled).toBeTrue()
  const pcbPads = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_smtpad")
  expect(pcbPads.length).toBeGreaterThan(0)
})
