import { expect, test } from "bun:test"
import type { SchematicPortArrangement } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic pin counts match legacy sizes and preserve explicit mappings", async () => {
  const renderArrangement = async (arrangement: SchematicPortArrangement) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" schPinArrangement={arrangement} />
      </board>,
    )
    await circuit.renderUntilSettled()
    return {
      sourcePorts: circuit.db.source_port.list(),
      schematicPorts: circuit.db.schematic_port.list(),
      schematicComponent: circuit.db.schematic_component.list()[0],
    }
  }

  const cases: {
    label: string
    arrangement: SchematicPortArrangement
    legacy: SchematicPortArrangement
    pinCount: number
  }[] = [
    {
      label: "PinCount: 4 left / 4 right",
      arrangement: { leftPinCount: 4, rightPinCount: 4 },
      legacy: { leftSize: 4, rightSize: 4 },
      pinCount: 8,
    },
    {
      label: "PinCount: all four sides",
      arrangement: {
        leftPinCount: 2,
        rightPinCount: 2,
        topPinCount: 2,
        bottomPinCount: 2,
      },
      legacy: { leftSize: 2, rightSize: 2, topSize: 2, bottomSize: 2 },
      pinCount: 8,
    },
    {
      label: "Mixed PinCount and Size",
      arrangement: {
        leftPinCount: 1,
        rightSize: 2,
        topPinCount: 3,
        bottomSize: 2,
      },
      legacy: { leftSize: 1, rightSize: 2, topSize: 3, bottomSize: 2 },
      pinCount: 8,
    },
    {
      label: "Zero PinCount overrides Size",
      arrangement: {
        leftPinCount: 0,
        leftSize: 4,
        rightPinCount: 2,
        rightSize: 6,
        topPinCount: 1,
        topSize: 3,
        bottomPinCount: 2,
        bottomSize: 1,
      },
      legacy: { leftSize: 0, rightSize: 2, topSize: 1, bottomSize: 2 },
      pinCount: 5,
    },
    {
      label: "Undefined PinCount uses Size",
      arrangement: { leftPinCount: undefined, leftSize: 2, rightPinCount: 2 },
      legacy: { leftSize: 2, rightSize: 2 },
      pinCount: 4,
    },
  ]

  for (const { arrangement, legacy, pinCount } of cases) {
    const rendered = await renderArrangement(arrangement)
    const legacyRendered = await renderArrangement(legacy)
    expect(rendered.sourcePorts).toHaveLength(pinCount)
    expect(rendered.schematicPorts).toHaveLength(pinCount)
    expect(rendered).toEqual(legacyRendered)
  }

  // No pinLabels or footprint: only the explicitly listed sparse pins exist,
  // even when numeric count fields are also supplied.
  const explicit = await renderArrangement({
    leftSide: { pins: [2, 9], direction: "bottom-to-top" },
    rightSide: { pins: [7], direction: "top-to-bottom" },
  })
  const explicitWithCounts = await renderArrangement({
    leftSide: { pins: [2, 9], direction: "bottom-to-top" },
    rightSide: [7],
    leftPinCount: 3,
    rightPinCount: 0,
    rightSize: 4,
    topPinCount: undefined,
  })
  expect(explicitWithCounts).toEqual(explicit)
  expect(explicit.sourcePorts.map((port) => port.pin_number)).toEqual([2, 9, 7])
  expect(explicit.schematicPorts.map((port) => port.pin_number)).toEqual([
    2, 9, 7,
  ])

  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      {cases.map(({ label, arrangement }, index) => (
        <group key={label} schX={index * 4}>
          <schematictext text={label} schY={2} fontSize={0.18} />
          <chip name={`U${index + 1}`} schPinArrangement={arrangement} />
        </group>
      ))}
    </board>,
  )
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
