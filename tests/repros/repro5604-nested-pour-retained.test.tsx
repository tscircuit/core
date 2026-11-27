import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a connected authored pour inside nested subcircuits has no warning", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <subcircuit name="Power">
        <subcircuit name="Ground">
          <resistor
            name="R1"
            resistance="10k"
            footprint="0603"
            connections={{ pin1: "net.GND", pin2: "net.GND" }}
          />
          <copperpour connectsTo="net.GND" layer="top" />
        </subcircuit>
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  expect(json.filter((element) => element.type === "pcb_copper_pour")).toEqual([
    expect.objectContaining({ layer: "top" }),
  ])
  expect(
    json.filter(
      (element) => element.type === "pcb_copper_pour_isolated_warning",
    ),
  ).toEqual([])
})
