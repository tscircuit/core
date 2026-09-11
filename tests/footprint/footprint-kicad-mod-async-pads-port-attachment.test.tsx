import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"

const twoPadKicadMod = `(footprint "TwoPad"
 (version 20240108)
 (generator "pcbnew")
 (layer "F.Cu")
 (attr smd)
 (fp_text reference "REF**" (at 0 -2) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
 (pad "1" smd rect (at -0.8 0) (size 0.9 1) (layers "F.Cu" "F.Paste" "F.Mask"))
 (pad "2" smd rect (at 0.8 0) (size 0.9 1) (layers "F.Cu" "F.Paste" "F.Mask"))
)`

it("assigns pcb_port_id to pads from an async-loaded .kicad_mod footprint (issue #3887)", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async (_url: string) => {
            const converter = new KicadFootprintToCircuitJsonConverter()
            converter.addFile("two-pad.kicad_mod", twoPadKicadMod)
            converter.runUntilFinished()
            return {
              footprintCircuitJson: converter.getOutput(),
            }
          },
        },
      },
    },
  })

  circuit.add(
    <board width="12mm" height="8mm">
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

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e: any) => e.type.includes("error"))

  const r1 = circuit.selectOne("resistor.R1")
  const r1PcbComponentId = r1?.pcb_component_id
  const r1Pads = circuitJson.filter(
    (e: any) =>
      e.type === "pcb_smtpad" && e.pcb_component_id === r1PcbComponentId,
  )

  expect(r1Pads.length).toBe(2)
  for (const pad of r1Pads) {
    expect(pad.pcb_port_id).toBeTruthy()
  }
  expect(errors).toEqual([])
})
