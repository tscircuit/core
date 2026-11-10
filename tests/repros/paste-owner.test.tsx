import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "circuit-json-to-kicad"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated-hole paste apertures keep their connector as the component owner", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
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
    const hole = circuit.db.pcb_plated_hole.list()[0]!
    expect(hole.pcb_component_id).toBeTruthy()
    const ownerBySide = circuit.db.pcb_solder_paste
      .list()
      .filter((paste) => !paste.pcb_smtpad_id)
      .map((paste) => ({
        layer: paste.layer,
        belongsToConnector: paste.pcb_component_id === hole.pcb_component_id,
      }))
    expect(ownerBySide).toEqual([
      { layer: "top", belongsToConnector: true },
      { layer: "bottom", belongsToConnector: true },
    ])
    const converter = new CircuitJsonToKicadPcbConverter(
      circuit.getCircuitJson(),
    )
    converter.runUntilFinished()
    const footprints = converter.getOutput().footprints
    expect(footprints).toHaveLength(1)
    const connector = footprints[0]!
    expect(
      connector.properties.some(
        (property) => property.key === "Reference" && property.value === "J1",
      ),
    ).toBe(true)
    const platedHolePaste = connector.fpPads.filter(
      (pad) => pad.shape === "circle" && pad.layers?.layers.length === 1,
    )
    expect(platedHolePaste.map((pad) => pad.layers!.layers[0]).sort()).toEqual([
      "B.Paste",
      "F.Paste",
    ])
  }
})
