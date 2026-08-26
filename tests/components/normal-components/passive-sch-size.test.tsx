import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor and capacitor schSize select compact premade symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R_DEFAULT" resistance="1k" schX={0} schY={3} />
      <resistor name="R_SM" resistance="1k" schSize="sm" schX={3} schY={3} />
      <resistor name="R_XS" resistance="1k" schSize="xs" schX={6} schY={3} />
      <resistor
        name="R_US_SM"
        resistance="1k"
        symbolName="resistor"
        schSize="sm"
        schX={9}
        schY={3}
      />
      <resistor
        name="R_US_XS_UP"
        resistance="1k"
        symbolName="resistor"
        schSize="xs"
        schRotation="90deg"
        schX={12}
        schY={3}
      />

      <capacitor name="C_DEFAULT" capacitance="1uF" schX={0} schY={0} />
      <capacitor name="C_SM" capacitance="1uF" schSize="sm" schX={3} schY={0} />
      <capacitor name="C_XS" capacitance="1uF" schSize="xs" schX={6} schY={0} />
      <capacitor
        name="C_SM_UP"
        capacitance="1uF"
        schSize="sm"
        schRotation="90deg"
        schX={9}
        schY={0}
      />
      <capacitor
        name="C_POLARIZED_SM"
        capacitance="1uF"
        polarized
        schSize="sm"
        schX={12}
        schY={0}
      />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.db.schematic_component.list()

  expect(schematicComponents.map(({ symbol_name }) => symbol_name)).toEqual([
    "boxresistor_right",
    "boxresistor_sm_right",
    "boxresistor_xs_right",
    "resistor_sm_right",
    "resistor_xs_up",
    "capacitor_right",
    "capacitor_sm_right",
    "capacitor_xs_right",
    "capacitor_sm_up",
    "capacitor_polarized_right",
  ])

  const expectedCompactSpans = new Map([
    ["boxresistor_sm_right", 0.5],
    ["boxresistor_xs_right", 0.35],
    ["resistor_sm_right", 0.5],
    ["resistor_xs_up", 0.35],
    ["capacitor_sm_right", 0.5],
    ["capacitor_xs_right", 0.35],
    ["capacitor_sm_up", 0.5],
  ])

  for (const schematicComponent of schematicComponents) {
    const expectedSpan = expectedCompactSpans.get(
      schematicComponent.symbol_name ?? "",
    )
    if (expectedSpan === undefined) continue

    const schematicPorts = circuit.db.schematic_port
      .list()
      .filter(
        ({ schematic_component_id }) =>
          schematic_component_id === schematicComponent.schematic_component_id,
      )

    expect(schematicPorts).toHaveLength(2)
    expect(
      Math.hypot(
        schematicPorts[1]!.center.x - schematicPorts[0]!.center.x,
        schematicPorts[1]!.center.y - schematicPorts[0]!.center.y,
      ),
    ).toBeCloseTo(expectedSpan, 12)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
