import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { H3RoutingStage } from "./run"
import { getNativeGeometryNotes } from "./snapshot"
import { getNativeH3StageCopper } from "./copper"

/** Draw native board-world points (mm, +X right, +Y up), without moving pads.
 * A stage view contains its actual routed copper, with teal crosses at explicitly
 * pending terminals. These crosses annotate access targets, not routed traces.
 */
export const getH3RoutedSnapshot = ({
  circuitJson,
  title,
  status,
  stage,
}: {
  circuitJson: AnyCircuitElement[]
  title: string
  status: string[]
  stage?: H3RoutingStage
}): string => {
  const board = circuitJson.find((element) => element.type === "pcb_board")
  if (!board || board.width === undefined || board.height === undefined) {
    throw new Error(
      "Native H3 board dimensions are missing from the routed view",
    )
  }
  const boardBounds = {
    minX: board.center.x - board.width / 2,
    maxX: board.center.x + board.width / 2,
    minY: board.center.y - board.height / 2,
    maxY: board.center.y + board.height / 2,
  }
  const copperView = stage
    ? circuitJson.filter(
        (element) => element.type !== "pcb_trace" && element.type !== "pcb_via",
      )
    : [...circuitJson]
  const annotations: AnyCircuitElement[] = []
  if (stage) {
    copperView.push(...getNativeH3StageCopper(stage))
    const pendingConnections =
      stage.start.simpleRouteJson.pendingRoutingAccess?.flatMap(
        (access) => access.connections,
      ) ?? []
    for (const [connectionIndex, connection] of pendingConnections.entries()) {
      for (const [
        terminalIndex,
        point,
      ] of connection.pointsToConnect.entries()) {
        for (const [axis, offset] of [
          ["horizontal", { x: 0.12, y: 0 }],
          ["vertical", { x: 0, y: 0.12 }],
        ] as const) {
          annotations.push({
            type: "pcb_note_line",
            pcb_note_line_id: `pending_terminal_${connectionIndex}_${terminalIndex}_${axis}`,
            layer: "top",
            x1: point.x - offset.x,
            y1: point.y - offset.y,
            x2: point.x + offset.x,
            y2: point.y + offset.y,
            stroke_width: 0.025,
            color: "#087c91",
          })
        }
      }
    }
  }
  const captions = [title, ...status]
  const fontSizes = captions.map((_, lineIndex) =>
    lineIndex === 0 ? 0.45 : 0.35,
  )
  const largestFontSize = Math.max(...fontSizes)
  const padding = largestFontSize * 2
  const lineGap = largestFontSize
  const lineHeight = largestFontSize + lineGap
  const headerBottom = boardBounds.maxY + padding
  const headerTop = headerBottom + captions.length * lineHeight - lineGap
  // A full em per character is a conservative horizontal label allowance.
  // The explicit viewport includes both the native board and its entire header.
  const headerWidth = Math.max(
    ...captions.map((text, lineIndex) => text.length * fontSizes[lineIndex]!),
  )
  const halfViewWidth = Math.max(board.width, headerWidth) / 2 + padding
  for (const [lineIndex, text] of captions.entries()) {
    annotations.push({
      type: "pcb_note_text",
      pcb_note_text_id: `h3_routed_caption_${lineIndex}`,
      pcb_group_id: "routing_status",
      text,
      anchor_position: {
        x: board.center.x,
        y: headerTop - largestFontSize / 2 - lineIndex * lineHeight,
      },
      font: "tscircuit2024",
      layer: "top",
      font_size: fontSizes[lineIndex]!,
      anchor_alignment: "center",
    })
  }
  return convertCircuitJsonToPcbSvg(
    [...copperView, ...getNativeGeometryNotes(circuitJson), ...annotations],
    {
      backgroundColor: "white",
      width: 1500,
      height: 1000,
      viewport: {
        minX: Math.min(
          boardBounds.minX - padding,
          board.center.x - halfViewWidth,
        ),
        maxX: Math.max(
          boardBounds.maxX + padding,
          board.center.x + halfViewWidth,
        ),
        minY: boardBounds.minY - padding,
        maxY: headerTop + padding,
      },
      shouldDrawErrors: false,
      shouldDrawRatsNest: false,
      showErrorsInTextOverlay: false,
      showDebugObjects: false,
      showPcbGroups: false,
    },
  )
}
