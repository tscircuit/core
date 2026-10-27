import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core polarity symbols follow resolved footprint terminals through rotation and mirroring", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    {
      name: "D_A1",
      reversed: false,
      ccwRotationDegrees: 0,
      layer: "top",
      x: -12,
      y: 6,
    },
    {
      name: "D_A2",
      reversed: true,
      ccwRotationDegrees: 0,
      layer: "top",
      x: -4,
      y: 6,
    },
    {
      name: "D_90",
      reversed: true,
      ccwRotationDegrees: 90,
      layer: "top",
      x: 4,
      y: 6,
    },
    {
      name: "D_180",
      reversed: true,
      ccwRotationDegrees: 180,
      layer: "bottom",
      x: 12,
      y: 6,
    },
    {
      name: "LED_A1",
      reversed: false,
      ccwRotationDegrees: 0,
      layer: "top",
      x: -12,
      y: -6,
    },
    {
      name: "LED_A2",
      reversed: true,
      ccwRotationDegrees: 0,
      layer: "top",
      x: -4,
      y: -6,
    },
    {
      name: "LED_270",
      reversed: true,
      ccwRotationDegrees: 270,
      layer: "bottom",
      x: 4,
      y: -6,
    },
    {
      name: "D_BOTTOM",
      reversed: true,
      ccwRotationDegrees: 90,
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
          pcbRotation: configuration.ccwRotationDegrees,
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
    const cathode = circuit.db.source_port
      .list({ source_component_id: source.source_component_id })
      .find((port) => port.name === "cathode")!
    const a = circuit.db.pcb_port.getWhere({
      source_port_id: anode.source_port_id,
    })!
    const k = circuit.db.pcb_port.getWhere({
      source_port_id: cathode.source_port_id,
    })!
    const filter = { pcb_component_id: pcb.pcb_component_id }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    expect(paths).toHaveLength(4)
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(0)
    expect(paths.every((path) => path.layer === configuration.layer)).toBe(true)
    // Board/world points in mm (+X right, +Y up): compare artwork to the
    // emitted terminals rather than reproducing the rotation or mirror.
    expect(paths[0]!.route[0]!.x).toBeCloseTo(a.x)
    expect(paths[0]!.route[0]!.y).toBeCloseTo(a.y)
    expect(paths[3]!.route[1]!.x).toBeCloseTo(k.x)
    expect(paths[3]!.route[1]!.y).toBeCloseTo(k.y)
    const bar = paths[2]!.route
    const barCenter = {
      x: (bar[0]!.x + bar[1]!.x) / 2,
      y: (bar[0]!.y + bar[1]!.y) / 2,
    }
    expect(Math.hypot(barCenter.x - k.x, barCenter.y - k.y)).toBeLessThan(
      Math.hypot(barCenter.x - a.x, barCenter.y - a.y),
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
