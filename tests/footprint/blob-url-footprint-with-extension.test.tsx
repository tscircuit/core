import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("blob footprint with an extension uses the configured file parser", async () => {
  const objectUrl = URL.createObjectURL(
    new Blob(["<footprint></footprint>"], { type: "text/plain" }),
  )
  const footprintUrl = `${objectUrl}#ext=kicad_mod`
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (receivedFootprintUrl) => {
            expect(receivedFootprintUrl).toBe(footprintUrl)
            return {
              footprintCircuitJson:
                external0402Footprint as AnyCircuitElement[],
            }
          },
        },
      },
    },
  })

  try {
    circuit.add(
      <board width="20mm" height="10mm">
        <resistor name="R1" resistance="10k" footprint={footprintUrl} />
        <pcbnotetext
          pcbY={-3}
          fontSize={0.6}
          text="Blob footprint loaded with file parser"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
})
