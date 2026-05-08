import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"

test("repro116: arduino uno trace and via inflation", async () => {
  const { circuit } = getTestFixture()

  const converter = new KicadToCircuitJsonConverter()
  converter.addFile("tests/repros/assets/arduino-uno.source.kicad_pcb", fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"))
  converter.runUntilFinished()
  const arduinoUnoCircuitJson = converter.getOutput()

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(1)

  expect(arduinoUnoCircuitJson).toMatchPcbSnapshot(`${import.meta.path}-before-inflation`)
  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-after-inflation`)
}, 15_000)
