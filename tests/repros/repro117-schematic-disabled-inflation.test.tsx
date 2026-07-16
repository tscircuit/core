import { expect, test } from "bun:test"
import fs from "node:fs"
import type { CircuitJson } from "circuit-json"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getArduinoUnoCircuitJson = () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  return converter.getOutput() as CircuitJson
}

const renderImportedArduinoUnoWithSchematicDisabled = async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  const arduinoUnoCircuitJson = getArduinoUnoCircuitJson()

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()
  return circuit
}

test("repro117: platform schematicDisabled disables the schematic and preserves imported pcb_traces", async () => {
  const circuit = await renderImportedArduinoUnoWithSchematicDisabled()

  const schematicElements = circuit
    .getCircuitJson()
    .filter((element) => element.type.startsWith("schematic_"))

  expect(schematicElements).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(188)
}, 15_000)
