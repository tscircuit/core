import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import {
  amphenol132289CircuitJson,
  createAmphenolCopperSnapshot,
} from "tests/fixtures/amphenol-132289"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("real Amphenol SMA preserves both copper sides through placement and caching", async () => {
  const expectedLayers = [
    { name: "J1", layers: ["bottom", "bottom", "top", "top", "top"] },
    { name: "J2", layers: ["top", "top", "bottom", "bottom", "bottom"] },
    { name: "R1", layers: ["top", "top"] },
    { name: "R2", layers: ["bottom", "bottom"] },
  ] as const
  let uncachedGeometry:
    | Pick<PcbSmtPadRect, "x" | "y" | "width" | "height" | "layer">[]
    | undefined

  for (const cached of [false, true]) {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: async () => ({
            footprintCircuitJson: amphenol132289CircuitJson,
          }),
        },
      },
    })
    circuit.add(
      <board width={68} height={30} routingDisabled schematicDisabled>
        <subcircuit
          name="RF"
          _subcircuitCachingEnabled={cached}
          pcbX={0}
          pcbY={0}
        >
          <connector
            name="J1"
            manufacturerPartNumber="132289"
            layer="top"
            isSmt
            pcbX={-18}
            pcbY={0}
            footprint="kicad:Connector_Coaxial/SMA_Amphenol_132289_EdgeMount"
          />
          <connector
            name="J2"
            manufacturerPartNumber="132289"
            layer="bottom"
            isSmt
            pcbX={18}
            pcbY={0}
            footprint="kicad:Connector_Coaxial/SMA_Amphenol_132289_EdgeMount"
          />
          <resistor
            name="R1"
            resistance="50"
            footprint="0402"
            layer="top"
            pcbX={-18}
            pcbY={10}
          />
          <resistor
            name="R2"
            resistance="50"
            footprint="0402"
            layer="bottom"
            pcbX={18}
            pcbY={10}
          />
        </subcircuit>
        <pcbnotetext
          text="Amphenol 132289 edge-mount SMA"
          pcbY={14}
          fontSize={1}
          color="white"
        />
        <pcbnotetext
          text="J1 mounted TOP: signal 1 on top"
          pcbX={-18}
          pcbY={7}
          fontSize={0.75}
          color="white"
        />
        <pcbnotetext
          text="J2 mounted BOTTOM: signal 1 on bottom"
          pcbX={18}
          pcbY={7}
          fontSize={0.75}
          color="white"
        />
        <pcbnotetext
          text="R1: ordinary 0402, TOP"
          pcbX={-18}
          pcbY={12}
          fontSize={0.65}
          color="white"
        />
        <pcbnotetext
          text="R2: ordinary 0402, BOTTOM"
          pcbX={18}
          pcbY={12}
          fontSize={0.65}
          color="white"
        />
        <pcbnotetext
          text="Ground pin 2 has matching pads on BOTH faces at Y = +/-4.25 mm"
          pcbY={-8}
          fontSize={0.7}
          color="white"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    // Capture the published copper before the regression assertion can fail.
    await expect(
      createAmphenolCopperSnapshot(circuit.getCircuitJson()),
    ).toMatchSvgSnapshot(import.meta.path, undefined, {
      diffThresholdPercent: 0,
    })

    for (const { name, layers } of expectedLayers) {
      const sourceComponent = circuit.db.source_component.getWhere({ name })!
      const pcbComponent = circuit.db.pcb_component.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })!
      const pads = circuit.db.pcb_smtpad
        .list()
        .filter(
          (pad): pad is PcbSmtPadRect =>
            pad.pcb_component_id === pcbComponent.pcb_component_id &&
            pad.shape === "rect",
        )
      expect(pads.map((pad) => pad.layer)).toEqual([...layers])
      for (const pad of pads) {
        const port = circuit.db.pcb_port.get(pad.pcb_port_id!)!
        const isSmaGround =
          name.startsWith("J") && pad.port_hints?.includes("2")
        expect([...port.layers].sort()).toEqual(
          isSmaGround ? ["bottom", "top"] : [pad.layer],
        )
        const paste = circuit.db.pcb_solder_paste
          .list()
          .filter((aperture) => aperture.pcb_smtpad_id === pad.pcb_smtpad_id)
        expect(paste.map((aperture) => aperture.layer)).toEqual([pad.layer])
      }
    }

    const geometry = circuit.db.pcb_smtpad
      .list()
      .filter((pad): pad is PcbSmtPadRect => pad.shape === "rect")
      .map(({ x, y, width, height, layer }) => ({ x, y, width, height, layer }))
      .sort((a, b) => a.x - b.x || a.y - b.y || a.layer.localeCompare(b.layer))
    if (cached) {
      expect(circuit.cachedSubcircuits?.size).toBe(1)
      expect(geometry).toEqual(uncachedGeometry!)
    } else {
      uncachedGeometry = geometry
    }
    expect(circuit.db.pcb_courtyard_overlap_error.list()).toEqual([])
    expect(circuit.db.external_footprint_load_error.list()).toEqual([])
  }
}, 30_000)
