import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED footprint polarity artwork is not duplicated and partial notes keep the fallback", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    {
      name: "LED_GENERIC_TOP",
      footprint: "smdpads2_p1.5mm_pw0.8mm_ph0.8mm",
      layer: "top",
      pcbX: -16,
      pcbRotation: 0,
    },
    {
      name: "LED_GENERIC_BOTTOM",
      footprint: "smdpads2_p1.5mm_pw0.8mm_ph0.8mm",
      layer: "bottom",
      pcbX: -7,
      pcbRotation: 90,
    },
    {
      name: "LED_NAMED",
      footprint: "led0805",
      layer: "top",
      pcbX: 2,
      pcbRotation: 0,
    },
  ] as const
  circuit.add(
    <board width={48} height={18} routingDisabled>
      {cases.map((item) => (
        <led
          key={item.name}
          {...item}
          pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
        />
      ))}
      <led
        name="LED_FALLBACK"
        footprint="0603"
        pcbX={11}
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
      >
        <fabricationnotetext text="USER" pcbY={-2} fontSize={0.4} />
      </led>
      <led
        name="LED_AUTHORED"
        footprint="0603"
        pcbX={19}
        pinLabels={{ pin1: ["cathode"], pin2: ["anode"] }}
      >
        <fabricationnotetext text="-" pcbX={-0.7} fontSize={0.4} />
        <fabricationnotetext text="+" pcbX={0.7} fontSize={0.4} />
        <fabricationnotepath
          route={[
            { x: -0.3, y: 0 },
            { x: 0.3, y: 0 },
          ]}
        />
      </led>
      <pcbnotetext
        text="Footprint artwork once; USER note keeps fallback; authored +/- artwork preserved"
        pcbY={6}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const { name, layer } of cases) {
    const led = circuit.selectOne(`.${name}`) as Led
    const filter = { pcb_component_id: led.pcb_component_id! }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    const labels = circuit.db.pcb_fabrication_note_text.list(filter)
    expect(paths).toHaveLength(4)
    expect(labels.map((n) => n.text).sort()).toEqual(["+", "-"])
    expect([...paths, ...labels].every((n) => n.layer === layer)).toBe(true)
    const ports = circuit.db.source_port.list({
      source_component_id: led.source_component_id!,
    })
    const a = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "anode")!.source_port_id,
    })!
    const k = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "cathode")!.source_port_id,
    })!
    const center = { x: (a.x + k.x) / 2, y: (a.y + k.y) / 2 }
    for (const [sign, port] of [
      ["+", a],
      ["-", k],
    ] as const) {
      const label = labels.find((n) => n.text === sign)!
      expect(
        (label.anchor_position.x - center.x) * (port.x - center.x) +
          (label.anchor_position.y - center.y) * (port.y - center.y),
      ).toBeGreaterThan(0)
    }
    led.updatePcbComponentSizeCalculation()
    expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(4)
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(2)
  }
  const fallback = circuit.selectOne(".LED_FALLBACK") as Led
  expect(
    circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: fallback.pcb_component_id!,
    }),
  ).toHaveLength(4)
  expect(
    circuit.db.pcb_fabrication_note_text
      .list({ pcb_component_id: fallback.pcb_component_id! })
      .map((n) => n.text),
  ).toEqual(["USER"])
  const authored = circuit.selectOne(".LED_AUTHORED") as Led
  expect(
    circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: authored.pcb_component_id!,
    }),
  ).toHaveLength(1)
  expect(
    circuit.db.pcb_fabrication_note_text
      .list({ pcb_component_id: authored.pcb_component_id! })
      .map((n) => n.text)
      .sort(),
  ).toEqual(["+", "-"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
