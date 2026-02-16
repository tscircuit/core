import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("Disable cadModel by setting it to null", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip footprint={"tssop8"} name="R1" />
      <resistor
        footprint={"0402"}
        name="R2"
        pcbY={5}
        resistance={"8k"}
        cadModel={null}
      />
    </board>,
  )

  circuit.render()
  await circuit.renderUntilSettled()

  expect(
    circuit.getCircuitJson().filter((x) => x.type === "cad_component").length,
  ).toBe(1)
  expect(
    circuit.getCircuitJson().filter((x) => x.type.includes("component_error"))
      .length,
  ).toBe(0)
})
