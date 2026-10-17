import { expect, test } from "bun:test"
import type { SchematicPortArrangement } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schPinArrangement with leftPinCount/rightPinCount creates schematic ports matching legacy Size", async () => {
  const renderArrangement = async (
    arrangement: SchematicPortArrangement,
    footprint?: string,
  ) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint={footprint} schPinArrangement={arrangement} />
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
    footprint?: string
  }[] = [
    {
      label: "PinCount: 4 left / 4 right",
      arrangement: { leftPinCount: 4, rightPinCount: 4 },
      legacy: { leftSize: 4, rightSize: 4 },
      pinCount: 8,
    },
    {
      label: "PinCount: 4 left / 4 right with soic8 footprint",
      arrangement: { leftPinCount: 4, rightPinCount: 4 },
      legacy: { leftSize: 4, rightSize: 4 },
      pinCount: 8,
      footprint: "soic8",
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
      label: "Undefined PinCount falls back to Size",
      arrangement: { leftPinCount: undefined, leftSize: 2, rightPinCount: 2 },
      legacy: { leftSize: 2, rightSize: 2 },
      pinCount: 4,
    },
  ]

  for (const { arrangement, legacy, pinCount, footprint } of cases) {
    const rendered = await renderArrangement(arrangement, footprint)
    const legacyRendered = await renderArrangement(legacy, footprint)
    expect(rendered.sourcePorts).toHaveLength(pinCount)
    expect(rendered.schematicPorts).toHaveLength(pinCount)
    expect(rendered.schematicComponent.port_arrangement).toEqual(
      legacyRendered.schematicComponent.port_arrangement,
    )
    expect(rendered.schematicPorts.map((p) => p.pin_number)).toEqual(
      legacyRendered.schematicPorts.map((p) => p.pin_number),
    )
    expect(rendered.sourcePorts.map((p) => p.pin_number)).toEqual(
      legacyRendered.sourcePorts.map((p) => p.pin_number),
    )
  }
})
