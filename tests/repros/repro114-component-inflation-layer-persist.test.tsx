import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("repro114-component-inflation-layer-persist", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitComponentsOnBottomLayerCircuitJson =
    await renderToCircuitJson(
      <group name="G1">
        <resistor name="R1" resistance="10k" footprint="0402" layer="bottom" />
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0402"
          layer="bottom"
        />
      </group>,
    )

  circuit.add(
    <board>
      <subcircuit
        name="S1"
        circuitJson={subcircuitComponentsOnBottomLayerCircuitJson}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcbSmtPad = circuitJson.filter(
    (c) => c.type === "pcb_smtpad" && c.layer === "bottom",
  )
  expect(pcbSmtPad).toHaveLength(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
