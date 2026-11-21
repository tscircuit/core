import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns when cleanup removes an authored pour inside nested subcircuits", async () => {
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
          <copperpour connectsTo="net.GND" layer="bottom" />
        </subcircuit>
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  expect(json.filter((element) => element.type === "pcb_copper_pour")).toEqual(
    [],
  )
  expect(
    json.filter(
      (element) => element.type === "pcb_copper_pour_isolated_warning",
    ),
  ).toEqual([expect.objectContaining({ layer: "bottom" })])
})
