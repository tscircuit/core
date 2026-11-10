import { beforeAll, describe, expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "circuit-json-to-kicad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

for (const cached of [false, true]) {
  describe(cached ? "cached subcircuit" : "direct render", () => {
    const { circuit } = getTestFixture()
    let pcb: ReturnType<CircuitJsonToKicadPcbConverter["getOutput"]>

    beforeAll(async () => {
      circuit.add(
        <board width={14} height={9} routingDisabled schematicDisabled>
          <subcircuit name="MODULE" _subcircuitCachingEnabled={cached}>
            <chip
              name="J1"
              isSmt
              footprint={
                <footprint>
                  <smtpad
                    shape="rect"
                    width={1.4}
                    height={1}
                    pcbX={-3}
                    portHints={["1"]}
                  />
                  <platedhole
                    shape="circle"
                    outerDiameter={1.5}
                    holeDiameter={0.8}
                    portHints={["2"]}
                  />
                </footprint>
              }
            />
          </subcircuit>
        </board>,
      )
      await circuit.renderUntilSettled()
      const converter = new CircuitJsonToKicadPcbConverter(
        circuit.getCircuitJson(),
      )
      converter.runUntilFinished()
      pcb = converter.getOutput()
    })

    test.failing("exports both plated-hole paste apertures in J1", () => {
      const hole = circuit.db.pcb_plated_hole.list()[0]!
      expect(hole.pcb_component_id).toBeTruthy()
      const owners = circuit.db.pcb_solder_paste
        .list()
        .filter((paste) => !paste.pcb_smtpad_id)
        .map((paste) => [paste.layer, paste.pcb_component_id])
      const footprints = pcb.footprints.map((footprint) => ({
        reference: footprint.properties.find((p) => p.key === "Reference")
          ?.value,
        pasteLayers: footprint.fpPads
          .filter(
            (pad) => pad.shape === "circle" && pad.layers?.layers.length === 1,
          )
          .map((pad) => pad.layers!.layers[0])
          .sort(),
      }))
      expect({ owners, footprints }).toEqual({
        owners: [
          ["top", hole.pcb_component_id],
          ["bottom", hole.pcb_component_id],
        ],
        footprints: [{ reference: "J1", pasteLayers: ["B.Paste", "F.Paste"] }],
      })
    })
  })
}
