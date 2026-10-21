import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native footprint polarity follows pinLabels through rotation and mirroring", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    { name: "D_A1", reversed: false, rotation: 0, layer: "top", x: -12, y: 6 },
    { name: "D_A2", reversed: true, rotation: 0, layer: "top", x: -4, y: 6 },
    { name: "D_90", reversed: true, rotation: 90, layer: "top", x: 4, y: 6 },
    {
      name: "D_180",
      reversed: true,
      rotation: 180,
      layer: "bottom",
      x: 12,
      y: 6,
    },
    {
      name: "LED_A1",
      reversed: false,
      rotation: 0,
      layer: "top",
      x: -12,
      y: -6,
    },
    { name: "LED_A2", reversed: true, rotation: 0, layer: "top", x: -4, y: -6 },
    {
      name: "LED_270",
      reversed: true,
      rotation: 270,
      layer: "bottom",
      x: 4,
      y: -6,
    },
    {
      name: "D_BOTTOM",
      reversed: true,
      rotation: 90,
      layer: "bottom",
      x: 12,
      y: -6,
    },
  ] as const
  circuit.add(
    <board width={36} height={24} routingDisabled>
      {cases.map((configuration) => {
        const props = {
          name: configuration.name,
          footprint: configuration.name.startsWith("LED")
            ? "led0805"
            : "sod123",
          pinLabels: configuration.reversed
            ? { pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }
            : { pin1: ["anode", "pos"], pin2: ["cathode", "neg"] },
          pcbX: configuration.x,
          pcbY: configuration.y,
          pcbRotation: configuration.rotation,
          layer: configuration.layer,
        }
        return configuration.name.startsWith("LED") ? (
          <led key={props.name} {...props} />
        ) : (
          <diode key={props.name} {...props} />
        )
      })}
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const configuration of cases) {
    const source = circuit.db.source_component
      .list()
      .find((component) => component.name === configuration.name)!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const anode = circuit.db.source_port
      .list({ source_component_id: source.source_component_id })
      .find((port) => port.name === "anode")!
    expect(anode.pin_number).toBe(configuration.reversed ? 2 : 1)
    const port = circuit.db.pcb_port.getWhere({
      source_port_id: anode.source_port_id,
    })!
    const plus = circuit.db.pcb_fabrication_note_text
      .list({ pcb_component_id: pcb.pcb_component_id })
      .find((note) => note.text === "+")!
    expect(plus.layer).toBe(configuration.layer)
    // Compare emitted points in board/world mm (+X right, +Y up). A positive
    // dot product places the annotation on the same side of the body as A.
    expect(
      (plus.anchor_position.x - pcb.center.x) * (port.x - pcb.center.x) +
        (plus.anchor_position.y - pcb.center.y) * (port.y - pcb.center.y),
    ).toBeGreaterThan(0)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
