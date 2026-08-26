import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector no-connect attributes propagate to custom symbol ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <connector
        name="J1"
        pinCount={4}
        footprint="pinrow4"
        pinLabels={{
          pin1: ["SLEEVE"],
          pin2: ["RING2"],
          pin3: ["RING1"],
          pin4: ["TIP"],
        }}
        pinAttributes={{
          RING2: { doNotConnect: true },
        }}
        noConnect={["RING1"]}
        symbol={
          <symbol width={3} height={3}>
            <schematicrect width={2} height={2.4} isFilled={false} />
            <port
              name="pin1"
              pinNumber={1}
              aliases={["SLEEVE"]}
              direction="left"
              schX={-1.5}
              schY={0.9}
            />
            <port
              name="pin2"
              pinNumber={2}
              aliases={["RING2"]}
              direction="left"
              schX={-1.5}
              schY={0.3}
            />
            <port
              name="pin3"
              pinNumber={3}
              aliases={["RING1"]}
              direction="left"
              schX={-1.5}
              schY={-0.3}
            />
            <port
              name="pin4"
              pinNumber={4}
              aliases={["TIP"]}
              direction="left"
              schX={-1.5}
              schY={-0.9}
            />
            <schematictext text="NC" fontSize={0.2} schX={0} schY={0} />
          </symbol>
        }
        connections={{
          SLEEVE: "net.SPK_NEG",
          TIP: "net.SPK_POS",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const ring1Port = sourcePorts.find((port) => port.name === "pin3")
  const ring2Port = sourcePorts.find((port) => port.name === "pin2")

  expect(ring1Port?.do_not_connect).toBe(true)
  expect(ring2Port?.do_not_connect).toBe(true)
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
  })
})
