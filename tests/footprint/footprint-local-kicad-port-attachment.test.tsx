import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"

test("local KiCad footprint attaches existing resistor ports before autorouting", async () => {
  const converter = new KicadFootprintToCircuitJsonConverter()
  converter.addFile(
    "two-pad.kicad_mod",
    `(footprint "TwoPad"
 (version 20240108) (generator "pcbnew") (layer "F.Cu") (attr smd)
 (fp_text reference "REF**" (at 0 -2) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
 (pad "1" smd rect (at -0.8 0) (size 0.9 1) (layers "F.Cu" "F.Paste" "F.Mask"))
 (pad "2" smd rect (at 0.8 0) (size 0.9 1) (layers "F.Cu" "F.Paste" "F.Mask")))`,
  )
  converter.runUntilFinished()
  const footprintCircuitJson = converter.getOutput()
  const { circuit } = getTestFixture({
    platform: {
      resolveProjectStaticFileImportUrl: async () =>
        "https://example.com/two-pad.kicad_mod",
      footprintFileParserMap: {
        kicad_mod: { loadFromUrl: async () => ({ footprintCircuitJson }) },
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="./two-pad.kicad_mod"
        pcbX={-3}
        schX={-2}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={3} schX={2} />
      <trace from="R1.pin2" to="R2.pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const r1 = circuit.db.source_component.getWhere({ name: "R1" })!
  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: r1.source_component_id,
  })!
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
  expect(pads).toHaveLength(2)
  for (const pad of pads) {
    expect(pad.pcb_port_id).toBeTruthy()
    const pcbPort = circuit.db.pcb_port.get(pad.pcb_port_id!)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)!
    expect(sourcePort.source_component_id).toBe(r1.source_component_id)
    expect(sourcePort.pin_number).toBe(Number(pad.port_hints![0]))
  }
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(json.filter((x) => x.type.endsWith("error"))).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
