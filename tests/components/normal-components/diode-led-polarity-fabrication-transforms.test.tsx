import { expect, test } from "bun:test"
import type { Diode } from "lib/components/normal-components/Diode"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core diode and LED markings follow actual terminals on both sides at every rotation", async () => {
  const { circuit } = getTestFixture()
  const cases = (["led", "diode"] as const).flatMap((kind, kindRow) =>
    ([1, 2] as const).flatMap((anodePin, pinRow) =>
      (["top", "bottom"] as const).flatMap((layer, sideRow) =>
        [0, 90, 180, 270].map((rotation, col) => ({
          kind,
          anodePin,
          layer,
          rotation,
          name: `${kind}_A${anodePin}_${layer}_${rotation}`,
          x: (col - 1.5) * 15,
          y: 42 - (kindRow * 4 + pinRow * 2 + sideRow) * 12,
        })),
      ),
    ),
  )
  circuit.add(
    <board width={66} height={106} routingDisabled>
      {cases.map((c) => {
        const props = {
          name: c.name,
          footprint: "smdpads2_p2.4mm_pw0.8mm_ph0.8mm",
          pinLabels:
            c.anodePin === 1
              ? { pin1: ["anode"], pin2: ["cathode"] }
              : { pin1: ["cathode"], pin2: ["anode"] },
          layer: c.layer,
          pcbRotation: c.rotation,
          pcbX: c.x,
          pcbY: c.y,
        }
        return c.kind === "led" ? (
          <led key={c.name} {...props} />
        ) : (
          <diode key={c.name} {...props} />
        )
      })}
      <pcbnotetext
        text="Core owns one symbol per LED/diode; bar follows cathode"
        pcbY={-50}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const c of cases) {
    const diode = circuit.selectOne(`.${c.name}`) as Diode | Led
    const filter = { pcb_component_id: diode.pcb_component_id! }
    const ports = circuit.db.source_port.list({
      source_component_id: diode.source_component_id!,
    })
    const a = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "anode")!.source_port_id,
    })!
    const k = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "cathode")!.source_port_id,
    })!
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    expect(paths).toHaveLength(4)
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toHaveLength(0)
    expect(paths.every((p) => p.layer === c.layer)).toBe(true)
    expect(paths[0]!.route[0]!.x).toBeCloseTo(a.x)
    expect(paths[0]!.route[0]!.y).toBeCloseTo(a.y)
    expect(paths[3]!.route[1]!.x).toBeCloseTo(k.x)
    expect(paths[3]!.route[1]!.y).toBeCloseTo(k.y)
    const bar = paths[2]!.route
    const mid = {
      x: (bar[0]!.x + bar[1]!.x) / 2,
      y: (bar[0]!.y + bar[1]!.y) / 2,
    }
    expect(Math.hypot(mid.x - k.x, mid.y - k.y)).toBeLessThan(
      Math.hypot(mid.x - a.x, mid.y - a.y),
    )
    diode.updatePcbComponentSizeCalculation()
    expect(
      circuit.db.pcb_fabrication_note_path.list(filter).map((p) => p.route),
    ).toEqual(paths.map((p) => p.route))
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
