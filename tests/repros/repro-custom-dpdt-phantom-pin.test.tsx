import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom DPDT symbol incorrectly inherits pin4 from the built-in symbol", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  const terminals = [
    { pinNumber: 1, x: -1, y: 1, direction: "left" },
    { pinNumber: 2, x: 1, y: 0.7, direction: "right" },
    { pinNumber: 3, x: -1, y: 0.4, direction: "left" },
    { pinNumber: 5, x: -1, y: -0.4, direction: "left" },
    { pinNumber: 6, x: 1, y: -0.7, direction: "right" },
    { pinNumber: 7, x: -1, y: -1, direction: "left" },
  ] as const

  circuit.add(
    <board>
      <schematictext
        text="Custom DPDT: only six terminals exist"
        schY={3}
        fontSize={0.28}
      />
      <schematictext
        text="Explicit symbol + pinLabels: 1, 2, 3, 5, 6, 7 (no pin4)"
        schY={2.5}
        fontSize={0.2}
      />
      <switch
        name="SW1"
        type="dpdt"
        pinLabels={{
          pin1: ["pin1"],
          pin2: ["pin2"],
          pin3: ["pin3"],
          pin5: ["pin5"],
          pin6: ["pin6"],
          pin7: ["pin7"],
        }}
        noConnect={terminals.map(({ pinNumber }) => `pin${pinNumber}`)}
        symbol={
          <symbol>
            <schematictext text="{NAME}" schY={1.65} fontSize={0.2} />
            {terminals.map(({ pinNumber, x, y, direction }) => (
              <port
                key={pinNumber}
                name={`pin${pinNumber}`}
                pinNumber={pinNumber}
                direction={direction}
                schX={x}
                schY={y}
                schStemLength={0.3}
              />
            ))}
            {terminals.map(({ pinNumber, x, y, direction }) => (
              <schematictext
                key={pinNumber}
                text={`pin${pinNumber}`}
                schX={x * 1.25}
                schY={y}
                anchor={direction === "left" ? "right" : "left"}
                fontSize={0.18}
              />
            ))}
            {[0, -1.4].map((offset) => (
              <schematicpath
                key={offset}
                points={[
                  { x: -0.7, y: 1 + offset },
                  { x: -0.4, y: 1 + offset },
                  { x: 0.4, y: 0.7 + offset },
                  { x: 0.7, y: 0.7 + offset },
                ]}
              />
            ))}
            {[0.4, -1].map((y) => (
              <schematicpath
                key={y}
                points={[
                  { x: -0.7, y },
                  { x: -0.4, y },
                ]}
              />
            ))}
          </symbol>
        }
      />
      <schematictext
        text="All six real terminals are intentionally no-connect (X)."
        schY={-1.8}
        fontSize={0.2}
      />
      <schematictext
        text="Expected: six source ports and no missing-trace warnings."
        schY={-2.25}
        fontSize={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const sourcePins = circuit.db.source_port
    .list()
    .map((port) => port.pin_number)
    .sort((a, b) => a! - b!)
  const warnings = circuit.db.source_pin_missing_trace_warning.list()

  // Capture the current bug; the fix must remove pin4, not suppress its warning.
  expect(sourcePins).toEqual([1, 2, 3, 4, 5, 6, 7])
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain("pin4")

  // Derive snapshot annotations from actual output, not a fabricated diagram.
  const board = circuit.firstChild as Board
  board.add(
    <schematictext
      text={`Actual source ports (${sourcePins.length}): ${sourcePins.join(", ")}`}
      schY={-2.9}
      fontSize={0.22}
    />,
  )
  board.add(
    <schematictext
      text={
        warnings.map((warning) => warning.message).join("; ") ||
        "No missing-trace warnings"
      }
      schY={-3.4}
      fontSize={0.22}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1100,
    height: 800,
  })
})
