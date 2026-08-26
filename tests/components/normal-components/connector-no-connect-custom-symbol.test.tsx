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
            {/*
              Conventional four-pole audio-jack topology: the jack opening and
              sleeve are at the left, with the sleeve, ring, and tip contacts
              stepping inward toward the plug axis. This is drawn from first
              principles rather than copied from a third-party symbol library.
            */}
            <schematicrect
              schX={-1.45}
              schY={-0.2}
              width={3.3}
              height={3}
              strokeWidth={0.025}
            />
            <schematicrect
              schX={-3.35}
              schY={-1.15}
              width={0.5}
              height={0.5}
              strokeWidth={0.025}
            />
            <schematicpath
              points={[
                { x: 0.2, y: 0.9 },
                { x: -2.5, y: 0.9 },
                { x: -2.5, y: -1.05 },
                { x: -2.7, y: -1.25 },
                { x: -2.9, y: -1.05 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0.2, y: 0.2 },
                { x: -1.8, y: 0.2 },
                { x: -1.8, y: -1.05 },
                { x: -2, y: -1.25 },
                { x: -2.2, y: -1.05 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0.2, y: -0.5 },
                { x: -1.1, y: -0.5 },
                { x: -1.1, y: -1.05 },
                { x: -1.3, y: -1.25 },
                { x: -1.5, y: -1.05 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0.2, y: -1.2 },
                { x: -0.4, y: -1.2 },
                { x: -0.6, y: -1.4 },
                { x: -0.8, y: -1.2 },
              ]}
            />
            <port
              name="pin4"
              pinNumber={4}
              aliases={["4"]}
              direction="right"
              schX={1.6}
              schY={-1.2}
              schStemLength={1.4}
              schPinLabelFontSize={0.12}
            />
            <port
              name="pin2"
              pinNumber={2}
              aliases={["2"]}
              direction="right"
              schX={1.6}
              schY={0.2}
              schStemLength={1.4}
              schPinLabelFontSize={0.12}
            />
            <port
              name="pin3"
              pinNumber={3}
              aliases={["3"]}
              direction="right"
              schX={1.6}
              schY={-0.5}
              schStemLength={1.4}
              schPinLabelFontSize={0.12}
            />
            <port
              name="pin1"
              pinNumber={1}
              aliases={["1"]}
              direction="right"
              schX={1.6}
              schY={0.9}
              schStemLength={1.4}
              schPinLabelFontSize={0.12}
            />
            <schematictext
              text="{NAME} AUDIO JACK (TRRS)"
              fontSize={0.2}
              schX={-1.45}
              schY={1.7}
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
