import { expect, test } from "bun:test"
import { normalizeDegrees } from "@tscircuit/math-utils"
import { assembly } from "lib"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_CONTACT_COUNT,
  ER_OLED096_1_3W_FLEXSCREEN_MODEL,
  ER_OLED096_1_3W_SCREEN_HEIGHT,
  ER_OLED096_1_3W_SCREEN_WIDTH,
  createErOled096ConnectorFootprint,
} from "tests/assembly/fixtures/er-oled096-1-3w"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen follows top and bottom connector transforms", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 45, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const cadModel = ER_OLED096_1_3W_FLEXSCREEN_MODEL

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
              pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
              footprint={createErOled096ConnectorFootprint("from_top")}
            />
          </board>
          <assembly.screen
            name="SCREEN"
            connectsTo=".B1 .J1"
            width={ER_OLED096_1_3W_SCREEN_WIDTH}
            height={ER_OLED096_1_3W_SCREEN_HEIGHT}
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
      const cableInsertionCenter = connectorPcbComponent?.cable_insertion_center
      if (!cableInsertionCenter || !connectorPcbComponent) {
        throw new Error(
          "Expected the FPC cable insertion center to be inferred",
        )
      }
      const connectorPads = circuit.db.pcb_smtpad
        .list()
        .filter(
          (pad): pad is typeof pad & { x: number; y: number } =>
            pad.pcb_component_id === connectorPcbComponent.pcb_component_id &&
            "x" in pad,
        )
      const getPadNumber = (pad: (typeof connectorPads)[number]) =>
        Number(pad.port_hints?.find((hint) => /^\d+$/.test(hint)))
      const contactPads = connectorPads.filter(
        (pad) => getPadNumber(pad) <= ER_OLED096_1_3W_CONTACT_COUNT,
      )
      const mountingPads = connectorPads.filter(
        (pad) => getPadNumber(pad) > ER_OLED096_1_3W_CONTACT_COUNT,
      )
      const getPadCenter = (pads: typeof connectorPads) => ({
        x: pads.reduce((sum, pad) => sum + pad.x, 0) / pads.length,
        y: pads.reduce((sum, pad) => sum + pad.y, 0) / pads.length,
      })
      const contactCenter = getPadCenter(contactPads)
      const mountingCenter = getPadCenter(mountingPads)
      const fpcInsertionAxis = {
        x: mountingCenter.x - contactCenter.x,
        y: mountingCenter.y - contactCenter.y,
      }
      const fpcInsertionAxisLength = Math.hypot(
        fpcInsertionAxis.x,
        fpcInsertionAxis.y,
      )
      const normalizedFpcInsertionAxis = {
        x: fpcInsertionAxis.x / fpcInsertionAxisLength,
        y: fpcInsertionAxis.y / fpcInsertionAxisLength,
      }
      const expectedScreenRotation = normalizeDegrees(
        (Math.atan2(
          -normalizedFpcInsertionAxis.x,
          normalizedFpcInsertionAxis.y,
        ) *
          180) /
          Math.PI,
      )
      const effectiveCadBoardRotation =
        layer === "bottom"
          ? -(screenCadComponent?.rotation?.z ?? 0)
          : (screenCadComponent?.rotation?.z ?? 0)
      const emittedFlexAxis = {
        x: -Math.sin((effectiveCadBoardRotation * Math.PI) / 180),
        y: Math.cos((effectiveCadBoardRotation * Math.PI) / 180),
      }

      expect(contactPads).toHaveLength(ER_OLED096_1_3W_CONTACT_COUNT)
      expect(mountingPads).toHaveLength(2)
      expect(screenPcbComponent?.center).toEqual(cableInsertionCenter)
      expect(fpcInsertionAxisLength).toBeGreaterThan(0)
      expect(screenPcbComponent?.rotation).toBeCloseTo(expectedScreenRotation)
      expect(screenPcbComponent?.layer).toBe(layer)
      expect(emittedFlexAxis.x).toBeCloseTo(normalizedFpcInsertionAxis.x)
      expect(emittedFlexAxis.y).toBeCloseTo(normalizedFpcInsertionAxis.y)
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
          pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
          footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
        />
      </board>
      <assembly.screen
        name="SCREEN"
        connectsTo=".B1 .J1"
        cadModel={ER_OLED096_1_3W_FLEXSCREEN_MODEL}
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
