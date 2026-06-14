import { expect, test } from "bun:test"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import type { CircuitJson, PcbSmtPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const loadArduinoUnoCircuitJson = () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  return converter.getOutput() as CircuitJson
}

test("repro116: imported fiducials inflate as pcb-only artifacts", async () => {
  const { circuit } = getTestFixture()
  const arduinoUnoCircuitJson = loadArduinoUnoCircuitJson()

  const importedFiducialComponents = arduinoUnoCircuitJson.filter(
    (element): element is Extract<
      CircuitJson[number],
      { type: "source_component"; ftype: "simple_fiducial" }
    > =>
      element.type === "source_component" && element.ftype === "simple_fiducial",
  )
  expect(importedFiducialComponents.length).toBeGreaterThan(0)

  const importedFiducialPcbComponents = arduinoUnoCircuitJson.filter(
    (element): element is Extract<CircuitJson[number], { type: "pcb_component" }> =>
      element.type === "pcb_component" &&
      importedFiducialComponents.some(
        (sourceComponent) =>
          sourceComponent.source_component_id === element.source_component_id,
      ),
  )

  const importedFiducialPads = arduinoUnoCircuitJson.filter(
    (
      element,
    ): element is Extract<PcbSmtPad, { shape: "circle" }> =>
      element.type === "pcb_smtpad" &&
      element.shape === "circle" &&
      importedFiducialComponents.some((sourceComponent) => {
        const pcbComponent = importedFiducialPcbComponents.find(
          (candidate) =>
            candidate.source_component_id === sourceComponent.source_component_id,
        )

        return pcbComponent?.pcb_component_id === element.pcb_component_id
      }),
  )
  expect(importedFiducialPads.length).toBeGreaterThan(0)

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const inflatedFiducialChips = circuitJson.filter(
    (element) =>
      element.type === "source_component" &&
      element.ftype === "simple_chip" &&
      importedFiducialComponents.some(
        (sourceComponent) => sourceComponent.name === element.name,
      ),
  )
  expect(inflatedFiducialChips).toHaveLength(0)

  const inflatedPads = circuitJson.filter(
    (
      element,
    ): element is Extract<PcbSmtPad, { shape: "circle" }> =>
      element.type === "pcb_smtpad" && element.shape === "circle",
  )
  for (const importedPad of importedFiducialPads) {
    expect(
      inflatedPads.some(
        (inflatedPad) =>
          inflatedPad.shape === importedPad.shape &&
          Math.abs(inflatedPad.x - importedPad.x) < 1e-6 &&
          Math.abs(inflatedPad.y - importedPad.y) < 1e-6 &&
          Math.abs((inflatedPad.radius ?? 0) - (importedPad.radius ?? 0)) < 1e-6,
      ),
    ).toBe(true)
  }
}, 80_000)
