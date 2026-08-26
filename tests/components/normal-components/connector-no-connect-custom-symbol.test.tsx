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
          <symbol>
            {/* PJ-320D (JLCPCB C431535) contact geometry, scaled 4x for legibility. */}
            <schematicpath
              points={[
                { x: 0, y: -1.6 },
                { x: -1.84, y: -1.6 },
                { x: -2, y: -1.28 },
                { x: -2.16, y: -1.6 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0, y: -0.8 },
                { x: -1.44, y: -0.8 },
                { x: -1.6, y: -0.48 },
                { x: -1.76, y: -0.8 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0.32, y: 0 },
                { x: -1.04, y: 0 },
                { x: -1.2, y: -0.32 },
                { x: -1.36, y: 0 },
              ]}
            />
            <port
              name="pin4"
              pinNumber={4}
              aliases={["4"]}
              direction="right"
              schX={1.6}
              schY={0}
              schStemLength={1.6}
              schPinLabelFontSize="sm"
            />
            <port
              name="pin2"
              pinNumber={2}
              aliases={["2"]}
              direction="right"
              schX={1.6}
              schY={-1.6}
              schStemLength={1.6}
              schPinLabelFontSize="sm"
            />
            <port
              name="pin3"
              pinNumber={3}
              aliases={["3"]}
              direction="right"
              schX={1.6}
              schY={-0.8}
              schStemLength={1.6}
              schPinLabelFontSize="sm"
            />
            <port
              name="pin1"
              pinNumber={1}
              aliases={["1"]}
              direction="right"
              schX={1.6}
              schY={0.8}
              schStemLength={1.6}
              schPinLabelFontSize="sm"
            />
            <schematicrect
              schX={-3.2}
              schY={-0.72}
              width={0.48}
              height={1.44}
            />
            <schematicpath
              points={[
                { x: 0, y: 0.8 },
                { x: -3.2, y: 0.8 },
                { x: -3.2, y: 0 },
              ]}
            />
            <schematictext
              text="{NAME} PJ-320D"
              fontSize={0.24}
              schX={-1.2}
              schY={1.3}
            />
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

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
