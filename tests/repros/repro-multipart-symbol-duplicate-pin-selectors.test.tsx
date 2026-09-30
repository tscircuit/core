import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces resolve duplicate physical pins in multipart custom symbols", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="12mm" height="8mm">
      <chip
        name="U1"
        schX={0}
        schY={0}
        symbol={
          <symbol>
            <schematicrect
              schX={-1.2}
              schY={0}
              width={1}
              height={1.6}
              strokeWidth={0.05}
            />
            <schematictext text="UNIT A" schX={-1.2} schY={0} fontSize={0.18} />
            <port
              name="GND"
              aliases={["pin2"]}
              pinNumber={2}
              direction="left"
              schX={-1.9}
              schY={-0.5}
            />
            <port
              name="VCC"
              aliases={["pin5"]}
              pinNumber={5}
              direction="left"
              schX={-1.9}
              schY={0.5}
            />
            <schematicrect
              schX={1.2}
              schY={0}
              width={1}
              height={1.6}
              strokeWidth={0.05}
            />
            <schematictext text="UNIT B" schX={1.2} schY={0} fontSize={0.18} />
            <port
              name="GND"
              aliases={["pin2"]}
              pinNumber={2}
              direction="right"
              schX={1.9}
              schY={-0.5}
            />
            <port
              name="VCC"
              aliases={["pin5"]}
              pinNumber={5}
              direction="right"
              schX={1.9}
              schY={0.5}
            />
          </symbol>
        }
      />
      <net name="VREG" />
      <trace from=".U1 > .pin2" to="net.GND" />
      <trace from=".U1 > .pin5" to="net.VREG" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
