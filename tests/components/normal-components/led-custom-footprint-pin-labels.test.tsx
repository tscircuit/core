import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("led uses custom footprint port hints as pin labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <schematictext
        text="LED custom footprint labels: A/K, not default anode/cathode"
        schX={0}
        schY={2}
        fontSize={0.18}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={-3}
        pcbX={-3}
      />
      <led
        name="LED1"
        schX={1}
        pcbX={1}
        footprint={
          <footprint>
            <smtpad
              portHints={["A"]}
              pcbX="-0.5mm"
              pcbY={0}
              width="0.5mm"
              height="0.6mm"
              shape="rect"
            />
            <smtpad
              portHints={["K"]}
              pcbX="0.5mm"
              pcbY={0}
              width="0.5mm"
              height="0.6mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <trace from=".R1 > .pin2" to=".LED1 > .A" />
      <trace from=".LED1 > .K" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.selectOne(".LED1 > .A")).toBeTruthy()
  expect(circuit.selectOne(".LED1 > .K")).toBeTruthy()
  expect(circuit.selectOne(".LED1 > .anode")).toBeNull()
  expect(circuit.selectOne(".LED1 > .cathode")).toBeNull()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
