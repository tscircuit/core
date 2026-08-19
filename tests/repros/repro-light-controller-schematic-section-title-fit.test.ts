import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { AnyCircuitElement } from "circuit-json"
import "tests/fixtures/extend-expect-circuit-snapshot"

const circuitJson = JSON.parse(
  readFileSync(
    new URL(
      "./assets/light-controller-schematic-section-fit.circuit.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as AnyCircuitElement[]

test("light controller section titles are unreadable at fit-to-view", async () => {
  const usbSectionTitle = circuitJson.find(
    (element) =>
      element.type === "schematic_text" && element.text === "USB-C Power Input",
  )

  expect(usbSectionTitle).toMatchObject({
    type: "schematic_text",
    font_size: 0.18,
  })
  await expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
}, 120_000)
