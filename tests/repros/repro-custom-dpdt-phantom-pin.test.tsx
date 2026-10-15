import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  js202011jcqnPinLabels,
  js202011jcqnSymbol,
} from "tests/fixtures/js202011jcqn-symbol"

test("project SW4 symbol keeps its exact pins without a phantom pin4", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

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
        pinLabels={js202011jcqnPinLabels}
        symbol={js202011jcqnSymbol}
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
