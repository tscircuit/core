import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json10", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="12mm" height="10mm">
      <pushbutton name="SW1" footprint="pushbutton" pcbX={0} pcbY={0} />
    </board>,
  )

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} pcbX={-6} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={7}
        connections={{
          pin1: ".S1 .SW1 .pin1",
          pin2: ".S1 .SW1 .pin2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const errors = circuitJson.filter((element) => element.type.includes("error"))
  expect(errors).toHaveLength(0)

  const pushButton = circuitJson.find(
    (element) =>
      element.type === "source_component" &&
      element.ftype === "simple_push_button" &&
      element.name === "SW1",
  )
  expect(pushButton).toBeDefined()

  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  expect(sourceTraces).toHaveLength(2)
})
