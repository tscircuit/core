import { expect, test } from "bun:test"
import { schematic_text } from "circuit-json"
import "tests/fixtures/extend-expect-circuit-snapshot"
import rcCarCircuitJson from "./assets/rc-car-schematic-section-title-overlap.circuit.json"

test(
  "rc car schematic section titles overlap",
  async () => {
    const schematicTexts = rcCarCircuitJson
      .filter((element) => element.type === "schematic_text")
      .map((element) => schematic_text.parse(element))

    const overlappingTextPositions = schematicTexts
      .filter((text, index) =>
        schematicTexts.some(
          (otherText, otherIndex) =>
            otherIndex !== index &&
            otherText.position.x === text.position.x &&
            otherText.position.y === text.position.y,
        ),
      )
      .map((text) => text.position)

    expect(overlappingTextPositions).toEqual([
      { x: -16.900000000000002, y: -1.435 },
      { x: -16.900000000000002, y: -1.435 },
    ])

    await expect(rcCarCircuitJson).toMatchSchematicSnapshot(import.meta.path)
  },
  { timeout: 60_000 },
)
