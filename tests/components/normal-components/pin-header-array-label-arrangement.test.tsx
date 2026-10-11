import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader signal arrangements preserve one-based physical pins", async () => {
  const { circuit } = getTestFixture()
  const pinLabels = ["V5V", "GND", "V3V3", "RX", "TX", "GND2", "IO0", "IO4"]
  const reversedLabels = pinLabels.toReversed()

  circuit.add(
    <board width="50mm" height="30mm">
      <pinheader
        name="J_ARRAY"
        pinCount={8}
        pinLabels={pinLabels}
        facingDirection="right"
        schX={-4}
        pcbX={-15}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: reversedLabels },
        }}
      />
      <pinheader
        name="J_RECORD"
        pinCount={8}
        pinLabels={Object.fromEntries(
          pinLabels.map((label, pinIndex) => [`pin${pinIndex + 1}`, label]),
        )}
        facingDirection="left"
        pcbX={0}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: reversedLabels,
          },
        }}
      />
      <pinheader
        name="J_DEFAULT"
        pinCount={8}
        pinLabels={pinLabels}
        facingDirection="right"
        schX={4}
        pcbX={15}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const { name, side, pinOrder } of [
    { name: "J_ARRAY", side: "right", pinOrder: [8, 7, 6, 5, 4, 3, 2, 1] },
    { name: "J_RECORD", side: "left", pinOrder: [8, 7, 6, 5, 4, 3, 2, 1] },
    { name: "J_DEFAULT", side: "right", pinOrder: [1, 2, 3, 4, 5, 6, 7, 8] },
  ] as const) {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((component) => component.name === name)!
    const sourcePorts = circuit.db.source_port
      .list()
      .filter(
        (port) =>
          port.source_component_id === sourceComponent.source_component_id,
      )
    const schematicPorts = circuit.db.schematic_port
      .list()
      .filter((port) =>
        sourcePorts.some(
          (sourcePort) => sourcePort.source_port_id === port.source_port_id,
        ),
      )
      .sort((a, b) => b.center.y - a.center.y)

    expect(schematicPorts.map((port) => port.pin_number)).toEqual([...pinOrder])
    for (const schematicPort of schematicPorts) {
      const sourcePort = circuit.db.source_port.get(
        schematicPort.source_port_id,
      )!
      expect(sourcePort.pin_number).toBe(schematicPort.pin_number)
      expect(sourcePort.name).toBe(pinLabels[schematicPort.pin_number! - 1])
      expect(schematicPort.side_of_component).toBe(side)
      expect(schematicPort.facing_direction).toBe(side)

      const pcbPort = circuit.db.pcb_port
        .list()
        .find((port) => port.source_port_id === sourcePort.source_port_id)!
      const platedHole = circuit.db.pcb_plated_hole
        .list()
        .find((hole) => hole.pcb_port_id === pcbPort.pcb_port_id)!
      expect(platedHole.port_hints).toContain(String(sourcePort.pin_number))
    }
  }

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
