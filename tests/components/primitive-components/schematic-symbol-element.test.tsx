import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol renders multiple symbols for one physical chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="25mm">
      <chip
        name="Q1"
        footprint="soic8"
        pinLabels={{
          pin1: "G1",
          pin2: "S1",
          pin3: "G2",
          pin4: "S2",
          pin5: "D2",
          pin6: "D2",
          pin7: "D1",
          pin8: "D1",
        }}
        internallyConnectedPins={[
          ["pin5", "pin6"],
          ["pin7", "pin8"],
        ]}
        noSchematicRepresentation
      />

      <schematicsymbol
        name="A"
        displayName="Q1A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor"
        connections={{
          gate: ".Q1 > .pin1",
          source: ".Q1 > .pin2",
          drain: ".Q1 > .pin7",
        }}
        schX={-2}
      />

      <schematicsymbol
        name="B"
        displayName="Q1B"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor"
        connections={{
          gate: ".Q1 > .pin3",
          source: ".Q1 > .pin4",
          drain: ".Q1 > .pin5",
        }}
        schX={2}
      />

      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={-4}
        schY={-0.1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={-0.1}
      />

      <trace from=".R1 > .pin2" to=".Q1 > .pin1" />
      <trace from=".R2 > .pin2" to=".Q1 > .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const q1 = circuit.selectOne("chip.Q1")!
  const q1SourceComponent = circuit.db.source_component.get(
    q1.source_component_id!,
  )!
  const q1SchematicComponents = circuit.db.schematic_component
    .list()
    .filter(
      (component) => component.source_component_id === q1.source_component_id,
    )

  expect(q1SchematicComponents).toHaveLength(2)
  expect(
    q1SchematicComponents.map((component) => component.symbol_name),
  ).toEqual([
    "n_channel_e_mosfet_transistor_horz",
    "n_channel_e_mosfet_transistor_horz",
  ])

  const q1SchematicComponentIds = new Set(
    q1SchematicComponents.map((component) => component.schematic_component_id),
  )
  const q1SchematicPorts = circuit.db.schematic_port
    .list()
    .filter((port) => q1SchematicComponentIds.has(port.schematic_component_id!))

  expect(q1SchematicPorts).toHaveLength(6)
  expect(
    q1SchematicPorts
      .map(
        (port) => circuit.db.source_port.get(port.source_port_id!)?.pin_number,
      )
      .sort((a, b) => a! - b!),
  ).toEqual([1, 2, 3, 4, 5, 7])

  expect(
    circuit.selectOne(".Q1 > .pin5", { type: "port" })?.schematic_port_id,
  ).toBe(circuit.selectOne(".Q1 > .pin6", { type: "port" })?.schematic_port_id)
  expect(
    circuit.selectOne(".Q1 > .pin7", { type: "port" })?.schematic_port_id,
  ).toBe(circuit.selectOne(".Q1 > .pin8", { type: "port" })?.schematic_port_id)

  // displayName is intentionally deferred until schematic_component supports
  // a per-representation display override. It must not mutate the shared chip.
  expect(q1SourceComponent.display_name).toBeUndefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 0.5, labelCells: true },
  })
})
