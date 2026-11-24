import { parseCableString } from "@tscircuit/cableprinter"
import type {
  CadAssemblyBomItem,
  DrawingBalloon,
  DrawingPage,
  DrawingTable,
  DrawingTableCell,
} from "circuit-json"
import { AssemblyComponent } from "lib/components/base-components/AssemblyComponent"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { AssemblyCable } from "lib/components/primitive-components/AssemblyCable"
import { AssemblyDrawingBomTable } from "lib/components/primitive-components/AssemblyDrawingBomTable"
import type { AssemblyDrawingHarnessView } from "lib/components/primitive-components/AssemblyDrawingHarnessView"
import { AssemblyDrawingNote } from "lib/components/primitive-components/AssemblyDrawingNote"
import type { AssemblyDrawingPage } from "lib/components/primitive-components/AssemblyDrawingPage"
import { AssemblyDrawingWiringTable } from "lib/components/primitive-components/AssemblyDrawingWiringTable"
import type { AssemblyCableBomRole } from "lib/components/primitive-components/get-assembly-cable-bom-parts"
import {
  getAssemblyScope,
  getComponentsInAssemblyScope,
} from "lib/components/primitive-components/get-assembly-scope-components"
import { selectDrawingReferences } from "./resolve-drawing-stage-selection"

type Point = { x: number; y: number }
type Cell = Pick<
  DrawingTableCell,
  "text" | "horizontal_align" | "font_size"
> & {
  /** Columns covered, for a heading across the table. */
  span?: number
}
interface TableSpec
  extends Pick<
    DrawingTable,
    "name" | "anchor_position" | "anchor_alignment" | "column_widths"
  > {
  /** Top to bottom. */
  rows: Cell[][]
}
type BomRow = Pick<
  CadAssemblyBomItem,
  "cad_assembly_bom_item_id" | "name" | "quantity"
>

/** Paper mm. Tables are resolved here so renderers draw text, not records. */
const TABLE_ROW_HEIGHT = 6
const HEADING_FONT_SIZE = 2.2
const WIRING_PIN_COLUMN_WIDTH = 14
const WIRING_DETAIL_COLUMN_WIDTH = 24
const BOM_COLUMN_WIDTHS = [10, 76, 14]
/** Balloons sit in the band a harness view keeps clear above its connectors. */
const BALLOON_TOP_INSET = 3
const BALLOON_SIDE_INSET = 21

// A bare name selects that named part; anything else is a normal selector.
const toSelector = (reference: string) =>
  /^[\w-]+$/.test(reference) ? `.${reference}` : reference

const capitalize = (text: string) => text[0]!.toUpperCase() + text.slice(1)

/** Resolve every harness view, wiring list, parts list and balloon on a page
 * before anything is inserted, so an invalid reference leaves no partial
 * sheet. Paper coordinates are mm relative to the page anchor, +X right/+Y up.
 */
export function prepareHarnessDrawing(
  page: AssemblyDrawingPage,
  harnessViews: { view: AssemblyDrawingHarnessView; center: Point }[],
) {
  const { db } = page.root!

  const resolveCable = (
    context: PrimitiveComponent,
    reference: string,
    owner: string,
  ) => {
    const matches = selectDrawingReferences(
      context,
      toSelector(reference),
    ).filter((part): part is AssemblyCable => part instanceof AssemblyCable)
    if (matches.length !== 1)
      throw new Error(
        `${owner} cableRef "${reference}" must select exactly one assembly.cable; matched ${matches.length}`,
      )
    const cable = matches[0]!
    const record = cable.cad_cable_id
      ? db.cad_cable.get(cable.cad_cable_id)
      : null
    if (!record)
      throw new Error(
        `${owner} cable "${cable.name}" has not been rendered; harness drawings need CAD rendering enabled`,
      )
    const wires = db.cad_cable_wire
      .list()
      .filter((wire) => wire.cad_cable_id === record.cad_cable_id)
      .sort((a, b) => a.from_pin_number - b.from_pin_number)
    return { cable, record, wires }
  }

  const views = harnessViews.map(({ view, center }) => {
    const props = view._parsedProps
    const owner = `assembly.drawing.harnessview "${view.name || props.cableRef}"`
    const resolved = resolveCable(view, props.cableRef, owner)
    const definition = parseCableString(resolved.record.cableprinter_string)
    const multiContact = [definition.connectorA, definition.connectorB].some(
      (connector) => "pinCount" in connector && connector.pinCount > 1,
    )
    if (multiContact && !resolved.wires.length)
      throw new Error(
        `${owner} needs assembly.cablewire children on cable "${resolved.cable.name}" to know its wiring`,
      )
    // The record has no view-relative mode for flattened views, so nested
    // notes resolve to page positions here.
    const notes = view.children
      .filter(
        (child): child is AssemblyDrawingNote =>
          child instanceof AssemblyDrawingNote,
      )
      .map((note) => ({
        text: note._parsedProps.text,
        font_size: note._parsedProps.fontSize,
        position: {
          x:
            note._parsedProps.paperX ??
            center.x + (note._parsedProps.xOffsetFromViewCenter ?? 0),
          y:
            note._parsedProps.paperY ??
            center.y + (note._parsedProps.yOffsetFromViewCenter ?? 0),
        },
      }))
    return { view, center, owner, notes, ...resolved }
  })

  const wiringTables: TableSpec[] = page.children
    .filter(
      (child): child is AssemblyDrawingWiringTable =>
        child instanceof AssemblyDrawingWiringTable,
    )
    .map((table) => {
      const props = table._parsedProps
      const owner = `assembly.drawing.wiringtable "${table.name || props.cableRef}"`
      const { cable, record, wires } = resolveCable(
        table,
        props.cableRef,
        owner,
      )
      if (!wires.length)
        throw new Error(
          `${owner} cable "${cable.name}" has no assembly.cablewire children to list`,
        )
      // Detail columns appear only for attributes some wire states.
      const details = [
        {
          title: "SIGNAL",
          used: wires.some((wire) => wire.name),
          text: (wire: (typeof wires)[number]) => wire.name ?? "",
        },
        {
          title: "COLOR",
          used: wires.some((wire) => wire.color),
          text: (wire: (typeof wires)[number]) =>
            wire.color ? capitalize(wire.color) : "",
        },
        {
          title: "AWG",
          used: wires.some((wire) => wire.wire_awg !== undefined),
          text: (wire: (typeof wires)[number]) =>
            wire.wire_awg === undefined ? "" : String(wire.wire_awg),
        },
      ].filter((detail) => detail.used)
      const column_widths = [
        WIRING_PIN_COLUMN_WIDTH,
        ...details.map(() => WIRING_DETAIL_COLUMN_WIDTH),
        WIRING_PIN_COLUMN_WIDTH,
      ]
      const rows: Cell[][] = [
        [
          { text: record.from_connector_name ?? "A" },
          ...details.map((detail) => ({
            text: detail.title,
            font_size: HEADING_FONT_SIZE,
          })),
          { text: record.to_connector_name ?? "B" },
        ],
        ...wires.map((wire) => [
          { text: String(wire.from_pin_number) },
          ...details.map((detail) => ({ text: detail.text(wire) })),
          { text: String(wire.to_pin_number) },
        ]),
      ]
      if (props.title !== undefined)
        rows.unshift([{ text: props.title, span: column_widths.length }])
      return {
        name: props.name,
        anchor_position: { x: props.paperX, y: props.paperY },
        anchor_alignment: props.anchorAlignment,
        column_widths,
        rows,
      }
    })

  const scopeBomRows = (): BomRow[] => {
    const scope = getAssemblyScope(page)
    const items = db.cad_assembly_bom_item.list()
    if (scope instanceof AssemblyComponent && scope.cad_assembly_bom_item_id)
      return items.filter(
        (item) =>
          item.parent_cad_assembly_bom_item_id ===
          scope.cad_assembly_bom_item_id,
      )
    const owned = new Set(
      getComponentsInAssemblyScope(page).flatMap((part) =>
        part instanceof AssemblyComponent && part.cad_assembly_bom_item_id
          ? [part.cad_assembly_bom_item_id]
          : [],
      ),
    )
    return items.filter(
      (item) =>
        owned.has(item.cad_assembly_bom_item_id) &&
        !owned.has(item.parent_cad_assembly_bom_item_id ?? ""),
    )
  }
  const bomTables = page.children
    .filter(
      (child): child is AssemblyDrawingBomTable =>
        child instanceof AssemblyDrawingBomTable,
    )
    .map((table) => {
      const props = table._parsedProps
      const owner = `assembly.drawing.bomtable "${table.name || props.partRef || "assembly"}"`
      let target: AssemblyComponent<any> | undefined
      let items: BomRow[]
      if (props.partRef === undefined) {
        items = scopeBomRows()
      } else {
        const matches = selectDrawingReferences(
          table,
          toSelector(props.partRef),
        ).filter(
          (part): part is AssemblyComponent<any> =>
            part instanceof AssemblyComponent,
        )
        if (matches.length !== 1)
          throw new Error(
            `${owner} partRef "${props.partRef}" must select exactly one assembly part; matched ${matches.length}`,
          )
        target = matches[0]!
        items = db.cad_assembly_bom_item
          .list()
          .filter(
            (item) =>
              item.parent_cad_assembly_bom_item_id ===
              target!.cad_assembly_bom_item_id,
          )
      }
      if (!items.length) throw new Error(`${owner} has no BOM items to list`)
      const heading: Cell[] = ["NO.", "DESCRIPTION", "QTY"].map((text) => ({
        text,
        font_size: HEADING_FONT_SIZE,
      }))
      const lines: Cell[][] = items.map((item, index) => [
        { text: String(index + 1) },
        { text: item.name, horizontal_align: "left" },
        { text: String(item.quantity) },
      ])
      // A parts list hung from its bottom edge reads upward from its heading,
      // so later items can be added above without renumbering what is drawn.
      const rows = props.anchorAlignment.startsWith("bottom")
        ? [...lines.reverse(), heading]
        : [heading, ...lines]
      const spec: TableSpec = {
        name: props.name,
        anchor_position: { x: props.paperX, y: props.paperY },
        anchor_alignment: props.anchorAlignment,
        column_widths: BOM_COLUMN_WIDTHS,
        rows,
      }
      return { target, items, spec }
    })

  const balloons = views.flatMap(({ view, center, owner, cable }) => {
    const props = view._parsedProps
    if (!props.showBalloons) return []
    const partsList = bomTables.find(({ target }) => target === cable)
    if (!partsList || !cable.cableBomItems.length)
      throw new Error(
        `${owner} showBalloons needs an assembly.drawing.bomtable with partRef to cable "${cable.name}" on the same page`,
      )
    const itemNumbers = (...roles: AssemblyCableBomRole[]) => [
      ...new Set(
        roles.flatMap((role) =>
          cable.cableBomItems
            .filter((item) => item.roles.includes(role))
            .map((item) =>
              String(
                partsList.items.findIndex(
                  (row) =>
                    row.cad_assembly_bom_item_id ===
                    item.cad_assembly_bom_item_id,
                ) + 1,
              ),
            ),
        ),
      ),
    ]
    const top = center.y + props.height / 2 - BALLOON_TOP_INSET
    const left = center.x - props.width / 2
    const callouts: Omit<
      DrawingBalloon,
      "type" | "drawing_balloon_id" | "drawing_wiring_harness_view_id"
    >[] = [
      {
        texts: itemNumbers("from_contacts", "from_housing"),
        harness_target: "from_connector",
        anchor_position: { x: left + BALLOON_SIDE_INSET, y: top },
        anchor_alignment: "top_right",
      },
      {
        texts: itemNumbers("wires"),
        harness_target: "wires",
        anchor_position: { x: left + 0.4 * props.width, y: top },
        anchor_alignment: "top_center",
      },
      {
        texts: itemNumbers("to_contacts", "to_housing"),
        harness_target: "to_connector",
        anchor_position: {
          x: left + props.width - BALLOON_SIDE_INSET,
          y: top,
        },
        anchor_alignment: "top_left",
      },
    ]
    return callouts.map((callout) => ({ view, callout }))
  })

  return {
    insert(drawing_page_id: DrawingPage["drawing_page_id"]) {
      const viewIds = new Map<AssemblyDrawingHarnessView, string>()
      for (const { view, center, record, notes } of views) {
        const props = view._parsedProps
        viewIds.set(
          view,
          db.drawing_wiring_harness_view.insert({
            drawing_page_id,
            cad_cable_id: record.cad_cable_id,
            name: props.name,
            display_name: props.displayName,
            center,
            width: props.width,
            height: props.height,
          }).drawing_wiring_harness_view_id,
        )
        for (const note of notes)
          db.drawing_page_note.insert({ drawing_page_id, ...note })
      }
      for (const { rows, ...table } of [
        ...wiringTables,
        ...bomTables.map(({ spec }) => spec),
      ]) {
        const { drawing_table_id } = db.drawing_table.insert({
          ...table,
          drawing_page_id,
          row_heights: rows.map(() => TABLE_ROW_HEIGHT),
        })
        for (const [rowIndex, row] of rows.entries()) {
          let column = 0
          for (const { span = 1, ...cell } of row) {
            db.drawing_table_cell.insert({
              ...cell,
              drawing_table_id,
              start_row_index: rowIndex,
              end_row_index: rowIndex,
              start_column_index: column,
              end_column_index: column + span - 1,
            })
            column += span
          }
        }
      }
      for (const { view, callout } of balloons)
        db.drawing_balloon.insert({
          ...callout,
          drawing_wiring_harness_view_id: viewIds.get(view)!,
        })
    },
  }
}
