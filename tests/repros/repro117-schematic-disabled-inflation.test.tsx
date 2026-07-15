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

const renderImportedArduinoUno = async () => {
  const { circuit } = getTestFixture()
  const arduinoUnoCircuitJson = getArduinoUnoCircuitJson()
  const importedPcbTraceCount = arduinoUnoCircuitJson.filter(
    (element) => element.type === "pcb_trace",
  ).length

  circuit.add(
    <board schematicDisabled>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()
  return { circuit, importedPcbTraceCount }
}

test("repro117: schematic disabled on board preserves imported pcb_traces", async () => {
  const { circuit, importedPcbTraceCount } = await renderImportedArduinoUno()
  const renderedPcbTraces = circuit.db.pcb_trace.list()

  expect(importedPcbTraceCount).toBe(188)
  expect(renderedPcbTraces.length).toBe(importedPcbTraceCount)
}, 15_000)
