import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("project SW4 symbol keeps its exact pins without a phantom pin4", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  // Exact SW4 symbol from pico-pd-motor-lab/imports/JS202011JCQN.tsx.
  circuit.add(
    <board>
      <schematictext
        text="SW4 / JS202011JCQN: exact project symbol"
        schY={3}
        fontSize={0.28}
      />
      <schematictext
        text="Declared pins: 1, 2, 3, 5, 6, 7. There is no pin4."
        schY={2.5}
        fontSize={0.2}
      />
      <switch
        name="SW4"
        type="dpdt"
        pinLabels={{
          pin1: ["pin1"],
          pin2: ["pin2"],
          pin3: ["pin3"],
          pin5: ["pin5"],
          pin6: ["pin6"],
          pin7: ["pin7"],
        }}
        symbol={
          <symbol>
            {/* C&K contact numbering: common 2/6; OFF closes 1-2 and 5-6. */}
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-0.8}
              schY={0.7}
              schStemLength={0.2}
            />
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={0.8}
              schY={0.4}
              schStemLength={0.2}
            />
            <port
              name="pin3"
              pinNumber={3}
              direction="left"
              schX={-0.8}
              schY={0.1}
              schStemLength={0.2}
            />
            <port
              name="pin5"
              pinNumber={5}
              direction="left"
              schX={-0.8}
              schY={-0.5}
              schStemLength={0.2}
            />
            <port
              name="pin6"
              pinNumber={6}
              direction="right"
              schX={0.8}
              schY={-0.8}
              schStemLength={0.2}
            />
            <port
              name="pin7"
              pinNumber={7}
              direction="left"
              schX={-0.8}
              schY={-1.1}
              schStemLength={0.2}
            />
            <schematicpath
              points={[
                { x: -0.6, y: 0.7 },
                { x: -0.4, y: 0.7 },
                { x: 0.4, y: 0.4 },
                { x: 0.6, y: 0.4 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.6, y: 0.1 },
                { x: -0.4, y: 0.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.6, y: -0.5 },
                { x: -0.4, y: -0.5 },
                { x: 0.4, y: -0.8 },
                { x: 0.6, y: -0.8 },
              ]}
            />
            <schematicpath
              points={[
                { x: -0.6, y: -1.1 },
                { x: -0.4, y: -1.1 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0, y: 0.5 },
                { x: 0, y: 0.25 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0, y: 0.05 },
                { x: 0, y: -0.2 },
              ]}
            />
            <schematicpath
              points={[
                { x: 0, y: -0.4 },
                { x: 0, y: -0.65 },
              ]}
            />
            <schematictext text="{NAME}" schX={0} schY={1.15} fontSize={0.2} />
            <schematictext
              text="DPDT • shown OFF"
              schX={0}
              schY={-1.5}
              fontSize={0.16}
            />
          </symbol>
        }
        noConnect={["pin7"]}
        connections={{
          pin1: "net.GND",
          pin2: "net.POWER_SWITCH_EN",
          pin3: "net.POWER_ON_LEVEL",
          pin5: "net.GND",
          pin6: "net.ARM_BASE",
        }}
      />
      <schematictext
        text="Original wiring: five connected pins; only pin7 is intentionally NC."
        schY={-2.2}
        fontSize={0.2}
      />
      <schematictext
        text="Expected: six source ports and no missing-trace warnings."
        schY={-2.65}
        fontSize={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const sourcePins = sourcePorts
    .map((port) => port.pin_number)
    .sort((a, b) => a! - b!)
  const warnings = circuit.db.source_pin_missing_trace_warning.list()

  expect(sourcePins).toEqual([1, 2, 3, 5, 6, 7])
  expect(warnings).toHaveLength(0)
  expect(
    sourcePorts
      .filter((port) => port.do_not_connect)
      .map((port) => port.pin_number),
  ).toEqual([7])

  // Derive snapshot annotations from actual output; do not alter the symbol.
  const board = circuit.firstChild as Board
  board.add(
    <schematictext
      text={`Actual source ports (${sourcePins.length}): ${sourcePins.join(", ")}`}
      schY={-3.3}
      fontSize={0.22}
    />,
  )
  board.add(
    <schematictext
      text={
        warnings.map((warning) => warning.message).join("; ") ||
        "No missing-trace warnings"
      }
      schY={-3.8}
      fontSize={0.22}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1200,
    height: 900,
  })
})
