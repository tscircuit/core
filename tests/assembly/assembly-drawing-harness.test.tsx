import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a wired cable draws as a harness sheet with its wiring list, parts list and balloons", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board width={50} height={25} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={6}
          pcbX={-15}
          footprint="jst6_ph"
        />
        <connector
          name="J2"
          standard="jst_ph"
          pinCount={6}
          pcbX={15}
          footprint="jst6_ph"
        />
      </board>
      <assembly.cable
        name="MOTOR_CABLE"
        from=".J1"
        to=".J2"
        length="50mm"
        lengthTolerance="3mm"
        fromConnectorName="H1"
        toConnectorName="H2"
        wireAwg="22awg"
      >
        <assembly.cablewire fromPin={1} toPin={1} color="black" />
        <assembly.cablewire fromPin={3} toPin={4} color="black" />
        <assembly.cablewire fromPin={4} toPin={3} color="black" />
        <assembly.cablewire fromPin={6} toPin={6} color="black" />
      </assembly.cable>
      <assembly.drawing.page size="iso_a4" anchorAlignment="bottom_left">
        <assembly.drawing.titleblock
          title="PH-6P CABLE, 22AWG, L=50mm"
          identificationNumber="MOTOR-CABLE"
          revisionIndex="A"
          legalOwner="tscircuit"
          creator="tscircuit"
          dateOfIssue="2026-11-21"
          sheetNumber={1}
          numberOfSheets={1}
        />
        <assembly.drawing.harnessview
          name="harness"
          cableRef="MOTOR_CABLE"
          centerX={148.5}
          centerY={148}
          width={230}
          height={76}
          showBalloons
        />
        <assembly.drawing.wiringtable
          cableRef="MOTOR_CABLE"
          title="WIRING"
          paperX={212}
          paperY={98}
          anchorAlignment="top_left"
        />
        <assembly.drawing.bomtable
          partRef="MOTOR_CABLE"
          paperX={5}
          paperY={5}
          anchorAlignment="bottom_left"
        />
        <assembly.drawing.note
          text="100% electrical testing: no shorts, no opens."
          paperX={10}
          paperY={55}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  const cable = circuit.db.cad_cable.list()[0]!
  expect(cable).toMatchObject({
    name: "MOTOR_CABLE",
    cableprinter_string: "jst_ph_pins6",
    nominal_length: 50,
    length_tolerance: 3,
    from_connector_name: "H1",
    to_connector_name: "H2",
  })
  expect(
    circuit.db.cad_cable_wire
      .list()
      .map((wire) => [wire.from_pin_number, wire.to_pin_number, wire.wire_awg]),
  ).toEqual([
    [1, 1, 22],
    [3, 4, 22],
    [4, 3, 22],
    [6, 6, 22],
  ])
  const cableBomItem = circuit.db.cad_assembly_bom_item
    .list()
    .find((item) => item.name === "MOTOR_CABLE")!
  expect(
    circuit.db.cad_assembly_bom_item
      .list()
      .filter(
        (item) =>
          item.parent_cad_assembly_bom_item_id ===
          cableBomItem.cad_assembly_bom_item_id,
      )
      .map((item) => [item.name, item.quantity]),
  ).toEqual([
    ["22 AWG wire, black, 50 mm", 4],
    ["JST PH housing, 6 position", 2],
    ["JST PH crimp contact", 8],
  ])

  const view = circuit.db.drawing_wiring_harness_view.list()[0]!
  expect(view).toMatchObject({
    name: "harness",
    cad_cable_id: cable.cad_cable_id,
    center: { x: 148.5, y: 148 },
    width: 230,
    height: 76,
  })
  expect(
    circuit.db.drawing_table
      .list()
      .map((table) => [
        table.anchor_alignment,
        table.anchor_position,
        table.column_widths,
        table.row_heights.length,
      ]),
  ).toEqual([
    ["top_left", { x: 212, y: 98 }, [14, 24, 24, 14], 6],
    ["bottom_left", { x: 5, y: 5 }, [10, 76, 14], 4],
  ])
  const cellTexts = (drawing_table_id: string) =>
    circuit.db.drawing_table_cell
      .list()
      .filter((cell) => cell.drawing_table_id === drawing_table_id)
      .map((cell) => cell.text)
  const [wiring, partsList] = circuit.db.drawing_table.list()
  expect(cellTexts(wiring!.drawing_table_id).slice(0, 9)).toEqual([
    "WIRING",
    "H1",
    "COLOR",
    "AWG",
    "H2",
    "1",
    "Black",
    "22",
    "1",
  ])
  // Hung from its bottom edge, the parts list reads upward from its heading.
  expect(cellTexts(partsList!.drawing_table_id)).toEqual([
    "3",
    "JST PH crimp contact",
    "8",
    "2",
    "JST PH housing, 6 position",
    "2",
    "1",
    "22 AWG wire, black, 50 mm",
    "4",
    "NO.",
    "DESCRIPTION",
    "QTY",
  ])
  expect(
    circuit.db.drawing_balloon
      .list()
      .map((balloon) => [
        balloon.harness_target,
        balloon.texts,
        balloon.anchor_alignment,
        balloon.drawing_wiring_harness_view_id,
      ]),
  ).toEqual([
    [
      "from_connector",
      ["3", "2"],
      "top_right",
      view.drawing_wiring_harness_view_id,
    ],
    ["wires", ["1"], "top_center", view.drawing_wiring_harness_view_id],
    [
      "to_connector",
      ["3", "2"],
      "top_left",
      view.drawing_wiring_harness_view_id,
    ],
  ])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  // Rendering again leaves one set of records.
  circuit.render()
  expect(circuit.db.cad_cable_wire.list()).toHaveLength(4)
  expect(circuit.db.cad_assembly_bom_item.list()).toHaveLength(4)
  expect(circuit.db.drawing_table.list()).toHaveLength(2)
  expect(circuit.db.drawing_balloon.list()).toHaveLength(3)
})
