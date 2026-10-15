import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drawings without ports retain built-in terminal inference and layout", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <schematictext
        text="Custom drawings without ports: keep the built-in terminal fallback"
        schY={3.3}
        fontSize={0.25}
      />
      <schematictext
        text="SW4: exact project drawing with only its six ports removed"
        schX={-4}
        schY={2.7}
        fontSize={0.16}
      />
      {/* Preserve SW4's pinLabels and wiring. Only omit the symbol ports. */}
      <switch
        name="SW4"
        schX={-4}
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
        text="Main fallback retained: built-in pin4 exists; pin7 lacks a drawing terminal."
        schX={-4}
        schY={-2.1}
        fontSize={0.14}
      />
      <schematictext
        text="SW5: drawing only, with no pinLabels or symbol ports"
        schX={4}
        schY={2.7}
        fontSize={0.16}
      />
      <switch
        name="SW5"
        type="spst"
        schX={4}
        symbol={
          <symbol>
            <schematicrect width={1} height={0.5} />
            <schematictext text="{NAME}" schY={0.8} fontSize={0.2} />
          </symbol>
        }
        connections={{ pin1: "net.INPUT", pin2: "net.OUTPUT" }}
      />
      <schematictext
        text="The fallback must still create both electrical and schematic ports."
        schX={4}
        schY={-2.1}
        fontSize={0.14}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Board
  for (const [name, schX, expectedSourcePins, expectedSchematicPins] of [
    ["SW4", -4, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6]],
    ["SW5", 4, [1, 2], [1, 2]],
  ] as const) {
    const component = circuit.db.source_component
      .list()
      .find((c) => c.name === name)!
    const sourcePorts = circuit.db.source_port
      .list()
      .filter((p) => p.source_component_id === component.source_component_id)
    const sourcePins = sourcePorts
      .map((p) => p.pin_number)
      .sort((a, b) => a! - b!)
    const schematicPins = circuit.db.schematic_port
      .list()
      .flatMap((p) => {
        const sourcePort = sourcePorts.find(
          (source) => source.source_port_id === p.source_port_id,
        )
        return sourcePort ? [sourcePort.pin_number] : []
      })
      .sort((a, b) => a! - b!)
    expect(sourcePins).toEqual([...expectedSourcePins])
    expect(schematicPins).toEqual([...expectedSchematicPins])
    board.add(
      <schematictext
        text={`Electrical pins: ${sourcePins.join(", ")}`}
        schX={schX}
        schY={-2.6}
        fontSize={0.18}
      />,
    )
    board.add(
      <schematictext
        text={`Drawing terminals: ${schematicPins.join(", ")}`}
        schX={schX}
        schY={-3}
        fontSize={0.18}
      />,
    )
  }
  const warnings = circuit.db.source_pin_missing_trace_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toBe("Port pin4 on SW4 is missing a trace")
  expect(circuit.db.schematic_trace.list()).toHaveLength(7)
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1500,
    height: 800,
  })
})
