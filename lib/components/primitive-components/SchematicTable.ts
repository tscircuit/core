import { schematicTableProps } from "@tscircuit/props";
import { PrimitiveComponent } from "../base-components/PrimitiveComponent";
import type { SchematicCell } from "./SchematicCell";
import type { SchematicRow } from "./SchematicRow";

export class SchematicTable extends PrimitiveComponent<
  typeof schematicTableProps
> {
  isSchematicPrimitive = true;
  schematic_table_id: string | null = null;

  get config() {
    return {
      componentName: "SchematicTable",
      zodProps: schematicTableProps,
    };
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return;
    const { db } = this.root!;
    const { _parsedProps: props } = this;

    const rows = this.children.filter(
      (c): c is SchematicRow => c.componentName === "SchematicRow",
    );

    if (rows.length === 0) return;

    const grid: (SchematicCell | null)[][] = [];
    let maxCols = 0;

    for (const row of rows) {
      const cells = row.children.filter(
        (c): c is SchematicCell => c.componentName === "SchematicCell",
      );
      maxCols = Math.max(maxCols, cells.length);
    }

    for (let i = 0; i < rows.length; i++) {
      grid[i] = [];
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.children.filter(
        (c): c is SchematicCell => c.componentName === "SchematicCell",
      );
      let k = 0;
      for (let j = 0; j < cells.length; j++) {
        while (grid[i][k]) {
          k++;
        }
        const cell = cells[j];
        const colSpan = cell._parsedProps.colSpan ?? 1;
        const rowSpan = cell._parsedProps.rowSpan ?? 1;
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            if (!grid[i + r]) grid[i + r] = [];
            grid[i + r][k + c] = cell;
          }
        }
        k += colSpan;
      }
    }
    maxCols = Math.max(0, ...grid.map((r) => r.length));

    const rowHeights: number[] = rows.map(
      (row, i) => row._parsedProps.height ?? 1,
    );

    const colWidths: number[] = Array.from({ length: maxCols }, (_, j) => {
      let maxWidth = 0;
      for (let i = 0; i < rows.length; i++) {
        const cell = grid[i]?.[j];
        if (cell) {
          const text = cell._parsedProps.text ?? cell._parsedProps.children;
          const cellWidth =
            cell._parsedProps.width ?? (text?.length ?? 2) * 0.5;
          if (cellWidth > maxWidth) {
            maxWidth = cellWidth;
          }
        }
      }
      return maxWidth || 10;
    });

    const anchorPos = this._getGlobalSchematicPositionBeforeLayout();

    const table = db.schematic_table.insert({
      anchor_position: anchorPos,
      column_widths: colWidths,
      row_heights: rowHeights,
      cell_padding: props.cellPadding,
      border_width: props.borderWidth,
      anchor: props.anchor,
      subcircuit_id: this.getSubcircuit()?.subcircuit_id || "",
      schematic_component_id: this.parent?.schematic_component_id || "",
    });
    this.schematic_table_id = table.schematic_table_id;

    const processedCells = new Set<SchematicCell>();

    let yOffset = 0;
    for (let i = 0; i < rows.length; i++) {
      let xOffset = 0;
      for (let j = 0; j < maxCols; j++) {
        const cell = grid[i]?.[j];
        if (cell && !processedCells.has(cell)) {
          processedCells.add(cell);
          const cellProps = cell._parsedProps;
          const rowSpan = cellProps.rowSpan ?? 1;
          const colSpan = cellProps.colSpan ?? 1;

          let cellWidth = 0;
          for (let c = 0; c < colSpan; c++) {
            cellWidth += colWidths[j + c];
          }
          let cellHeight = 0;
          for (let r = 0; r < rowSpan; r++) {
            cellHeight += rowHeights[i + r];
          }

          db.schematic_table_cell.insert({
            schematic_table_id: this.schematic_table_id,
            start_row_index: i,
            end_row_index: i + rowSpan - 1,
            start_column_index: j,
            end_column_index: j + colSpan - 1,
            text: cellProps.text ?? cellProps.children,
            center: {
              x: anchorPos.x + xOffset + cellWidth / 2,
              y: anchorPos.y - yOffset - cellHeight / 2,
            },
            width: cellWidth,
            height: cellHeight,
            horizontal_align: cellProps.horizontalAlign,
            vertical_align: cellProps.verticalAlign,
            font_size: cellProps.fontSize ?? props.fontSize,
            subcircuit_id: this.getSubcircuit()?.subcircuit_id || "",
          });
        }
        if (colWidths[j]) {
          xOffset += colWidths[j];
        }
      }
      yOffset += rowHeights[i];
    }
  }
}
