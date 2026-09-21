import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polarized symbol terminals honor package labels at every rotation", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    { kind: "led", labels: { pin1: "anode", pin2: "cathode" }, anodePin: 1 },
    { kind: "led", labels: { pin1: "neg", pin2: "pos" }, anodePin: 2 },
    { kind: "laser", labels: { pin1: "cathode", pin2: "anode" }, anodePin: 2 },
    { kind: "diode", labels: { pin1: "anode", pin2: "cathode" }, anodePin: 1 },
    { kind: "diode", labels: { pin1: "neg", pin2: "pos" }, anodePin: 2 },
    { kind: "led", labels: { pin1: "cathode" }, anodePin: 2 },
  ] as const
  circuit.add(
    <board width={40} height={40} routingDisabled>
      {cases.flatMap(({ kind, labels }, row) =>
        [0, 90, 180, 270].map((rotation, col) => {
          const props = {
            name: `D_${row}_${rotation}`,
            pinLabels: labels,
            footprint: "0402",
            schX: col * 4,
            schY: -row * 3,
            pcbX: col * 4,
            pcbY: -row * 3,
            schRotation: rotation,
            pcbRotation: rotation,
            layer: col % 2 === 0 ? ("top" as const) : ("bottom" as const),
            schDisplayValue: `${kind}: ${Object.entries(labels)
              .map(([pin, label]) => `${pin}=${label}`)
              .join(" ")}`,
          }
          return kind === "led" || kind === "laser" ? (
            <led key={props.name} {...props} laser={kind === "laser"} />
          ) : (
            <diode key={props.name} {...props} />
          )
        }),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [row, { anodePin }] of cases.entries()) {
    for (const rotation of [0, 90, 180, 270]) {
      const component = circuit.db.source_component
        .list()
        .find((c) => c.name === `D_${row}_${rotation}`)!
      const ports = circuit.db.source_port
        .list()
        .filter((p) => p.source_component_id === component.source_component_id)
      const anode = ports.find((p) => p.pin_number === anodePin)!
      const cathode = ports.find((p) => p.pin_number === 3 - anodePin)!
      const schematicAnode = circuit.db.schematic_port
        .list()
        .find((p) => p.source_port_id === anode.source_port_id)!
      const schematicCathode = circuit.db.schematic_port
        .list()
        .find((p) => p.source_port_id === cathode.source_port_id)!
      // Schematic world coordinates are mm, +X right and +Y up. These
      // directions follow the drawn cathode bar at each symbol rotation.
      const delta =
        rotation % 180 === 0
          ? schematicCathode.center.x - schematicAnode.center.x
          : schematicCathode.center.y - schematicAnode.center.y
      expect(Math.sign(delta)).toBe(rotation < 180 ? 1 : -1)
      for (const port of [anode, cathode]) {
        const pcbPort = circuit.db.pcb_port
          .list()
          .find((p) => p.source_port_id === port.source_port_id)!
        const pad = circuit.db.pcb_smtpad
          .list()
          .find((p) => p.pcb_port_id === pcbPort.pcb_port_id)!
        expect(pad.port_hints).toContain(String(port.pin_number))
      }
    }
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
