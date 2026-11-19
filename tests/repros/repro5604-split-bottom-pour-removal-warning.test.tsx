import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("one warning covers all removed fragments of a split pour", async () => {
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
      <keepout shape="rect" width={1} height={10} layers={["bottom"]} />
      <copperpour connectsTo="net.GND" layer="bottom" />
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
