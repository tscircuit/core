import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematictext and silkscreentext should resolve {REFDES}, {REF}, {NAME}, and {REFERENCE} aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U42"
      symbol={
        <symbol>
          <schematictext schX={0} schY={1} text="{REFDES}" fontSize={0.2} />
          <schematictext schX={0} schY={2} text="{REF}" fontSize={0.2} />
          <schematictext schX={0} schY={3} text="{REFERENCE}" fontSize={0.2} />
          <schematictext schX={0} schY={4} text="{NAME}" fontSize={0.2} />
        </symbol>
      }
      footprint={
        <footprint>
          <silkscreentext
            pcbX={0}
            pcbY={1}
            text="{REFDES}"
            layer="top"
            fontSize={0.2}
          />
          <silkscreentext
            pcbX={0}
            pcbY={2}
            text="{REF}"
            layer="top"
            fontSize={0.2}
          />
          <silkscreentext
            pcbX={0}
            pcbY={3}
            text="{REFERENCE}"
            layer="top"
            fontSize={0.2}
          />
          <silkscreentext
            pcbX={0}
            pcbY={4}
            text="{NAME}"
            layer="top"
            fontSize={0.2}
          />
        </footprint>
      }
    />,
  )

  circuit.render()

  const schematicTexts = circuit.db.schematic_text.list()
  expect(schematicTexts.filter((t) => t.text === "U42").length).toBe(4)

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts.filter((t) => t.text === "U42").length).toBe(4)
})
