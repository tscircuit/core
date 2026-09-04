import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four-pin pushbutton connects to itself without internal pin metadata", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schMaxTraceDistance={1}>
      <schematictext
        text="Expected: WAKE_MR_N - SW1 - GND"
        fontSize={0.2}
        schY={2}
      />
      <pushbutton
        name="SW1"
        footprint="pushbutton_id1.3mm_od2mm"
        connections={{
          pin1: "net.WAKE_MR_N",
          pin2: "net.WAKE_MR_N",
          pin3: "net.GND",
          pin4: "net.GND",
        }}
      />
    </board>,
  )

  circuit.render()

  const pushbuttonSourceComponent = circuit.db.source_component
    .list()
    .find((sourceComponent) => sourceComponent.name === "SW1")!
  const pushbuttonSchematicPorts = circuit.db.schematic_port
    .list()
    .filter((schematicPort) => {
      const sourcePort = circuit.db.source_port.get(
        schematicPort.source_port_id!,
      )
      return (
        sourcePort?.source_component_id ===
        pushbuttonSourceComponent.source_component_id
      )
    })
  const renderedContactConnectivityKeys = new Set(
    pushbuttonSchematicPorts.map(
      (schematicPort) =>
        circuit.db.source_port.get(schematicPort.source_port_id!)!
          .subcircuit_connectivity_map_key,
    ),
  )

  expect(pushbuttonSchematicPorts).toHaveLength(2)
  expect(renderedContactConnectivityKeys).toHaveLength(1)
  expect(
    circuit.db.source_component_misconfigured_error
      .list()
      .filter((error) =>
        error.source_component_ids.includes(
          pushbuttonSourceComponent.source_component_id,
        ),
      ),
  ).toMatchObject([
    {
      message:
        "Pushbutton SW1 has both schematic contacts connected to the same net. Check its internallyConnectedPins and footprint pin mapping.",
      source_port_ids: pushbuttonSchematicPorts.map(
        (schematicPort) => schematicPort.source_port_id,
      ),
      is_fatal: true,
    },
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
