import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor footprints retain resolved terminals and delegate artwork on both layers", async () => {
  const { circuit } = getTestFixture()
  const cases = [false, true].flatMap((reversed, mapping) =>
    (["top", "bottom"] as const).flatMap((layer, side) =>
      [0, 90, 180, 270].map((rotation, col) => ({
        name: `C_${reversed ? "REV" : "STD"}_${layer}_${rotation}`,
        reversed,
        layer,
        rotation,
        x: (col - 1.5) * 10,
        y: 12 - (mapping * 2 + side) * 8,
      })),
    ),
  )
  circuit.add(
    <board width={42} height={34} routingDisabled>
      {cases.map(({ name, reversed, layer, rotation, x, y }) => (
        <capacitor
          key={name}
          name={name}
          capacitance="10uF"
          polarized
          footprint={reversed ? undefined : "1206"}
          layer={layer}
          pcbRotation={rotation}
          pcbX={x}
          pcbY={y}
        >
          {reversed && (
            <footprint>
              <smtpad
                shape="rect"
                width={1}
                height={1.5}
                pcbX={1.5}
                portHints={["1", "pos"]}
              />
              <smtpad
                shape="rect"
                width={1}
                height={1.5}
                pcbX={-1.5}
                portHints={["2", "neg"]}
              />
            </footprint>
          )}
        </capacitor>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_fabrication_note_text.list()).toHaveLength(0)
  for (const { name, layer } of cases) {
    const source = circuit.db.source_component.getWhere({ name })!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const ports = circuit.db.source_port.list({
      source_component_id: source.source_component_id,
    })
    const positiveSource = ports.find(
      (p) => p.name === "pos" || p.port_hints?.includes("pos"),
    )!
    const negativeSource = ports.find(
      (p) => p.name === "neg" || p.port_hints?.includes("neg"),
    )!
    const positive = circuit.db.pcb_port.getWhere({
      source_port_id: positiveSource.source_port_id,
    })!
    const negative = circuit.db.pcb_port.getWhere({
      source_port_id: negativeSource.source_port_id,
    })!
    const paths = circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    const capacitor = circuit.selectOne(`.${name}`) as Capacitor
    const footprint = capacitor.resolveFootprint()
    const expected =
      typeof footprint === "string"
        ? fp
            .string(footprint)
            .circuitJson()
            .filter((e) => e.type === "pcb_fabrication_note_path").length
        : 0
    expect(paths).toHaveLength(expected)
    expect(paths.every((p) => p.layer === layer)).toBe(true)
    const pads = circuit.db.pcb_smtpad.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    for (const port of [positive, negative]) {
      const pad = pads.find((pad) => pad.pcb_port_id === port.pcb_port_id)!
      expect("x" in pad ? pad.x : undefined).toBeCloseTo(port.x)
      expect("y" in pad ? pad.y : undefined).toBeCloseTo(port.y)
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
