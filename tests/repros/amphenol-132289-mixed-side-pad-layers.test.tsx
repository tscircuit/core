import { beforeAll, expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import {
  amphenol132289CircuitJson,
  createAmphenolThreePaneSnapshot,
} from "tests/fixtures/amphenol-132289"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const circuits: RootCircuit[] = []

beforeAll(async () => {
  for (const cached of [false, true]) {
    const { circuit, staticAssetsServerUrl } = getTestFixture({
      withStaticAssetsServer: true,
      platform: {
        footprintLibraryMap: {
          kicad: async () => ({
            footprintCircuitJson: amphenol132289CircuitJson,
          }),
        },
      },
    })
    // KiCad's STEP uses the same footprint-local mm origin and +Z-up frame.
    // Preserve that origin; core handles top/bottom placement of both models.
    const smaCadModel = {
      stepUrl: `${staticAssetsServerUrl}/models/SMA_Amphenol_132289_EdgeMount.step`,
      modelOriginPosition: { x: 0, y: 0, z: 0 },
    }
    circuit.add(
      <board width={41.08} height={30} routingDisabled schematicDisabled>
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
            pcbX={18}
            pcbY={0}
            footprint="kicad:Connector_Coaxial/SMA_Amphenol_132289_EdgeMount"
            cadModel={smaCadModel}
          />
          <connector
            name="J2"
            manufacturerPartNumber="132289"
            layer="bottom"
            isSmt
            pcbX={-18}
            pcbY={0}
            footprint="kicad:Connector_Coaxial/SMA_Amphenol_132289_EdgeMount"
            cadModel={smaCadModel}
          />
          <resistor
            name="R1"
            resistance="50"
            footprint="0402"
            layer="top"
            pcbX={8}
            pcbY={10}
          />
          <resistor
            name="R2"
            resistance="50"
            footprint="0402"
            layer="bottom"
            pcbX={-8}
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
          text="J1: TOP"
          pcbX={17}
          pcbY={7}
          fontSize={0.75}
          color="white"
        />
        <pcbnotetext
          text="J2: BOTTOM"
          pcbX={-17}
          pcbY={7}
          fontSize={0.75}
          color="white"
        />
        <pcbnotetext
          text="R1: 0402, TOP"
          pcbX={8}
          pcbY={12}
          fontSize={0.65}
          color="white"
        />
        <pcbnotetext
          text="R2: 0402, BOTTOM"
          pcbX={-8}
          pcbY={12}
          fontSize={0.65}
          color="white"
        />
        <pcbnotetext
          text="Ground 2: BOTH faces, Y = +/-4.25 mm"
          pcbY={-8}
          fontSize={0.7}
          color="white"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    // Keep snapshot failures outside test.failing so they still fail CI.
    // Cache equivalence is checked numerically without re-rendering 3D.
    if (!cached) {
      await expect(
        await createAmphenolThreePaneSnapshot(circuit.getCircuitJson()),
      ).toMatchSvgSnapshot(import.meta.path, undefined, {
        diffThresholdPercent: 0,
      })
    }

    circuits.push(circuit)
  }
}, 30_000)

test.failing(
  "real Amphenol SMA preserves both copper sides through placement and caching",
  () => {
    const expectedLayers = [
      { name: "J1", layers: ["bottom", "bottom", "top", "top", "top"] },
      { name: "J2", layers: ["top", "top", "bottom", "bottom", "bottom"] },
      { name: "R1", layers: ["top", "top"] },
      { name: "R2", layers: ["bottom", "bottom"] },
    ] as const
    let uncachedGeometry:
      | Pick<PcbSmtPadRect, "x" | "y" | "width" | "height" | "layer">[]
      | undefined

    for (const [circuitIndex, circuit] of circuits.entries()) {
      const cached = circuitIndex === 1
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
        .map(({ x, y, width, height, layer }) => ({
          x,
          y,
          width,
          height,
          layer,
        }))
        .sort(
          (a, b) => a.x - b.x || a.y - b.y || a.layer.localeCompare(b.layer),
        )
      if (cached) {
        expect(circuit.cachedSubcircuits?.size).toBe(1)
        expect(geometry).toEqual(uncachedGeometry!)
      } else {
        uncachedGeometry = geometry
      }
      expect(circuit.db.pcb_courtyard_overlap_error.list()).toEqual([])
      expect(circuit.db.external_footprint_load_error.list()).toEqual([])
    }
  },
)
