import { expect, test } from "bun:test"
import { pcb_copper_pour_isolated_warning } from "circuit-json"
import { CircuitJsonToKicadPcbConverter } from "circuit-json-to-kicad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when cleanup removes an authored inner1 pour", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={4}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-5}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="inner1" />
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
    layer: "inner1",
    center: { x: 0, y: 0 },
  })
  expect(warnings[0]!.message).toContain(
    "its connected copper has no path to a same-net pad or an explicitly placed via",
  )
  expect(json).toContainEqual(
    expect.objectContaining({
      type: "source_net",
      source_net_id: warnings[0]!.source_net_id,
      name: "GND",
    }),
  )
  expect(pcb_copper_pour_isolated_warning.parse(warnings[0])).toEqual(
    warnings[0],
  )
})
