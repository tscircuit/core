import { expect, test } from "bun:test"
import { assembly } from "lib"
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
            pcbRotation={30}
            cadModel={null}
            pinLabels={{ pin1: ["VCC"], pin2: ["GND"] }}
            footprint={
              <footprint insertionDirection="from_top">
                <smtpad
                  shape="rect"
                  portHints={["pin1"]}
                  pcbX="-1mm"
                  width="1mm"
                  height="3mm"
                />
                <smtpad
                  shape="rect"
                  portHints={["pin2"]}
                  pcbX="1mm"
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
          width="2.3in"
          height="1.8in"
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

  expect(sourceScreen?.ftype).toBe("simple_chip")
  expect(connectorPcbComponent?.cable_insertion_center).toBeDefined()
  expect(screenPcbComponent).toMatchObject({
    center: connectorPcbComponent?.cable_insertion_center,
    layer: "top",
    rotation: 30,
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
    rotation: { x: 0, y: 0, z: 30 },
    footprinter_string: "flexscreen_w58.42mm_h45.72mm",
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
    camPos: [65, 55, 80],
    poppygl: {
      lookAt: [0, 8, 0],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
