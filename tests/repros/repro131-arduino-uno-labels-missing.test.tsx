import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import type { CircuitJson } from "circuit-json"

test("repro131: arduino uno imported labels (A0, A1, SCL, SDA, DIGITAL-PWM) are present after subcircuit inflation", async () => {
  const { circuit } = getTestFixture()

  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  const arduinoUnoCircuitJson = converter.getOutput() as CircuitJson

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const copperTexts = circuit.db.pcb_copper_text.list()

  const allTextLabels = [
    ...silkscreenTexts.map((t) => t.text),
    ...copperTexts.map((t) => t.text),
  ]

  expect(allTextLabels).toContain("A0")
  expect(allTextLabels).toContain("A1")
  expect(allTextLabels).toContain("SCL")
  expect(allTextLabels).toContain("SDA")
  expect(allTextLabels.some((t) => t.includes("DIGITAL"))).toBe(true)

  // pcb_copper_text "UNO TH RevC" should also be present
  expect(allTextLabels.some((t) => t.includes("UNO"))).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 15_000)
