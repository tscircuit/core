import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "circuit-json-to-kicad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when cleanup removes an authored bottom pour", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-5}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  expect(json.filter((element) => element.type === "pcb_copper_pour")).toEqual(
    [],
  )
  const converter = new CircuitJsonToKicadPcbConverter(json)
  converter.runUntilFinished()
  expect(converter.getOutput().zones).toHaveLength(0)

  const warnings = json.filter(
    (element) => element.type === "pcb_copper_pour_isolated_warning",
  )
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    layer: "bottom",
    center: { x: 0, y: 0 },
  })
  expect(warnings[0]!.message).toContain(
    "its connected copper has no path to a same-net pad or an explicitly placed via",
  )
})
