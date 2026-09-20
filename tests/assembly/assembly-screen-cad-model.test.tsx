import { expect, test } from "bun:test"
import { assembly } from "lib"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_CONTACT_COUNT,
  ER_OLED096_1_3W_FLEXSCREEN_MODEL,
} from "tests/assembly/fixtures/er-oled096-1-3w"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen emits a connector-anchored modelprinter FlexScreen", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <assembly.device name="watch">
      <assembly.device name="display-module">
        <board
          name="B1"
          width="44mm"
          height="36mm"
          thickness="1.6mm"
          routingDisabled
        >
          <connector
            name="J1"
            pcbX="0mm"
            pcbY="-13mm"
            pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
            footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
          />
        </board>
        <assembly.screen
          name="SCREEN"
          connectsTo=".B1 .J1"
          cadModel={ER_OLED096_1_3W_FLEXSCREEN_MODEL}
        />
      </assembly.device>
    </assembly.device>,
  )

  await circuit.renderUntilSettled()

  const sourceScreen = circuit.db.source_component
    .list()
    .find((source) => source.name === "SCREEN")
  const sourceConnector = circuit.db.source_component
    .list()
    .find((source) => source.name === "J1")
  const screenPcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (pcbComponent) =>
        pcbComponent.source_component_id === sourceScreen?.source_component_id,
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
        cadComponent.source_component_id === sourceScreen?.source_component_id,
    )
  const connectorCadComponent = circuit.db.cad_component
    .list()
    .find(
      (cadComponent) =>
        cadComponent.source_component_id ===
        sourceConnector?.source_component_id,
    )

  expect(sourceScreen?.ftype).toBe("simple_chip")
  expect(sourceConnector).toMatchObject({
    ftype: "simple_connector",
    pin_count: ER_OLED096_1_3W_CONTACT_COUNT,
  })
  expect(connectorCadComponent?.footprinter_string).toBe(
    ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  )
  expect(connectorPcbComponent?.cable_insertion_center).toBeDefined()
  expect(screenPcbComponent).toMatchObject({
    center: connectorPcbComponent?.cable_insertion_center,
    layer: "top",
    rotation: 0,
    width: 0,
    height: 0,
    obstructs_within_bounds: false,
    do_not_place: true,
    is_allowed_to_be_off_board: true,
    subcircuit_id: connectorPcbComponent?.subcircuit_id,
  })
  expect(screenCadComponent).toMatchObject({
    position: {
      ...connectorPcbComponent?.cable_insertion_center,
      z: 0.8,
    },
    rotation: { x: 0, y: 0, z: 0 },
    footprinter_string: ER_OLED096_1_3W_FLEXSCREEN_MODEL,
    model_origin_position: { x: 0, y: 0, z: 0 },
    subcircuit_id: connectorPcbComponent?.subcircuit_id,
  })
  expect(
    circuit.db.schematic_component
      .list()
      .some(
        (schematicComponent) =>
          schematicComponent.source_component_id ===
          sourceScreen?.source_component_id,
      ),
  ).toBe(false)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [45, 38, 55],
    poppygl: {
      lookAt: [0, 0, 0],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
