import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import type { CircuitJson } from "circuit-json"

const getArduinoUnoCircuitJson = () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  return converter.getOutput() as CircuitJson
}

const renderImportedArduinoUno = async (opts: {
  schematicDisabled: boolean
}) => {
  const { circuit } = getTestFixture()
  const arduinoUnoCircuitJson = getArduinoUnoCircuitJson()

  const boardProps = opts.schematicDisabled ? { schematicDisabled: true } : {}

  circuit.add(
    <board {...boardProps}>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()
  return circuit
}

test("repro117: schematic disabled on board preserves imported pcb_traces", async () => {
  const circuitWithoutSchematicDisabled = await renderImportedArduinoUno({
    schematicDisabled: false,
  })
  const circuitWithSchematicDisabled = await renderImportedArduinoUno({
    schematicDisabled: true,
  })

  const pcbTracesWithoutSchematicDisabled =
    circuitWithoutSchematicDisabled.db.pcb_trace.list()
  const pcbTracesWithSchematicDisabled =
    circuitWithSchematicDisabled.db.pcb_trace.list()

  expect(pcbTracesWithoutSchematicDisabled.length).toBe(188)
  expect(pcbTracesWithSchematicDisabled.length).toBe(
    pcbTracesWithoutSchematicDisabled.length,
  )
}, 15_000)
