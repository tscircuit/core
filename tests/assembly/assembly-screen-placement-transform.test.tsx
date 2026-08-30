import { expect, test } from "bun:test"
import { normalizeDegrees } from "@tscircuit/math-utils"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen follows top and bottom connector transforms", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 45, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const cadModel = "flexscreen_w12mm_h8mm_flex6mm_sitsflat"

      circuit.add(
        <assembly.device name={`watch-${layer}-${rotation}`}>
          <board
            name="B1"
            width="30mm"
            height="30mm"
            thickness="1.6mm"
            routingDisabled
          >
            <connector
              name="J1"
              layer={layer}
              pcbRotation={rotation}
              cadModel={null}
              pinLabels={{ pin1: ["VCC"], pin2: ["GND"] }}
              footprint={
                <footprint insertionDirection="from_right">
                  <smtpad
                    shape="rect"
                    portHints={["pin1"]}
                    pcbX="1mm"
                    width="1mm"
                    height="3mm"
                  />
                  <smtpad
                    shape="rect"
                    portHints={["pin2"]}
                    pcbX="-1mm"
                    width="1mm"
                    height="3mm"
                  />
                </footprint>
              }
            />
          </board>
          <assembly.screen
            name="SCREEN"
            connectsTo=".B1 .J1"
            width="12mm"
            height="8mm"
            cadModel={cadModel}
          />
        </assembly.device>,
      )

      circuit.render()

      const sources = circuit.db.source_component.list()
      const sourceScreen = sources.find((source) => source.name === "SCREEN")
      const sourceConnector = sources.find((source) => source.name === "J1")
      const screenPcbComponent = circuit.db.pcb_component
        .list()
        .find(
          (pcbComponent) =>
            pcbComponent.source_component_id ===
            sourceScreen?.source_component_id,
        )
      const connectorPcbComponent = circuit.db.pcb_component
        .list()
        .find(
          (pcbComponent) =>
            pcbComponent.source_component_id ===
            sourceConnector?.source_component_id,
        )
      const screenCadComponent = circuit.db.cad_component
        .list()
        .find(
          (cadComponent) =>
            cadComponent.source_component_id ===
            sourceScreen?.source_component_id,
        )
      const pin1Pad = circuit.db.pcb_smtpad
        .list()
        .find(
          (pad) =>
            pad.pcb_component_id === connectorPcbComponent?.pcb_component_id &&
            pad.port_hints?.includes("pin1"),
        )
      if (!pin1Pad || !("x" in pin1Pad)) {
        throw new Error("Expected pin1 to render as a centered SMT pad")
      }
      const padAxis = {
        x: pin1Pad.x - (connectorPcbComponent?.center.x ?? 0),
        y: pin1Pad.y - (connectorPcbComponent?.center.y ?? 0),
      }
      const padAxisLength = Math.hypot(padAxis.x, padAxis.y)
      const normalizedPadAxis = {
        x: padAxis.x / padAxisLength,
        y: padAxis.y / padAxisLength,
      }
      const expectedScreenRotation = normalizeDegrees(
        (Math.atan2(-normalizedPadAxis.x, normalizedPadAxis.y) * 180) / Math.PI,
      )
      const effectiveCadBoardRotation =
        layer === "bottom"
          ? -(screenCadComponent?.rotation?.z ?? 0)
          : (screenCadComponent?.rotation?.z ?? 0)
      const emittedFlexAxis = {
        x: -Math.sin((effectiveCadBoardRotation * Math.PI) / 180),
        y: Math.cos((effectiveCadBoardRotation * Math.PI) / 180),
      }

      expect(screenPcbComponent?.center).toEqual(
        connectorPcbComponent?.cable_insertion_center,
      )
      expect(padAxisLength).toBeGreaterThan(0)
      expect(screenPcbComponent?.rotation).toBeCloseTo(expectedScreenRotation)
      expect(screenPcbComponent?.layer).toBe(layer)
      expect(emittedFlexAxis.x).toBeCloseTo(normalizedPadAxis.x)
      expect(emittedFlexAxis.y).toBeCloseTo(normalizedPadAxis.y)
      expect(screenCadComponent).toMatchObject({
        position: {
          ...connectorPcbComponent?.cable_insertion_center,
          z: layer === "bottom" ? -0.8 : 0.8,
        },
        rotation: {
          x: 0,
          y: layer === "bottom" ? 180 : 0,
          z: normalizeDegrees(
            layer === "bottom"
              ? -expectedScreenRotation
              : expectedScreenRotation,
          ),
        },
        footprinter_string: cadModel,
      })
    }
  }

  const { circuit: bottomCircuit } = getTestFixture()
  bottomCircuit.add(
    <assembly.device name="bottom-watch-visual">
      <board
        name="B1"
        width="30mm"
        height="30mm"
        thickness="1.6mm"
        routingDisabled
      >
        <connector
          name="J1"
          layer="bottom"
          pcbRotation={90}
          cadModel={null}
          pinLabels={{ pin1: ["VCC"], pin2: ["GND"] }}
          footprint={
            <footprint insertionDirection="from_right">
              <smtpad
                shape="rect"
                portHints={["pin1"]}
                pcbX="1mm"
                width="1mm"
                height="3mm"
              />
              <smtpad
                shape="rect"
                portHints={["pin2"]}
                pcbX="-1mm"
                width="1mm"
                height="3mm"
              />
            </footprint>
          }
        />
      </board>
      <assembly.screen
        name="SCREEN"
        connectsTo=".B1 .J1"
        width="16mm"
        height="9mm"
        cadModel="flexscreen_w16mm_h9mm_flex7mm_lateraloffset3mm_sitsflat"
      />
    </assembly.device>,
  )

  await expect(bottomCircuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [35, -45, -50],
    poppygl: {
      lookAt: [0, 4, -1],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
