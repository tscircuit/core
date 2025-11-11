import { convertCircuitJsonToBpc } from "circuit-json-to-bpc"
import { getGraphicsForBpcGraph, layoutSchematicGraphVariants } from "bpc-graph"
import Debug from "debug"
import type { Group } from "./Group"
import type { z } from "zod"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import { updateSchematicPrimitivesForLayoutShift } from "./utils/updateSchematicPrimitivesForLayoutShift"

const debug = Debug("Group_doInitialSchematicLayoutMatchAdapt")

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  const subtreeCircuitJson = buildSubtree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  const bpcGraphBeforeGeneratedNetLabels =
    convertCircuitJsonToBpc(subtreeCircuitJson)

  if (debug.enabled && global?.debugGraphics) {
    global.debugGraphics?.push(
      getGraphicsForBpcGraph(bpcGraphBeforeGeneratedNetLabels, {
        title: `floatingBpcGraph-${group.name}`,
      }),
    )
  }

  // console.log("Writing subtreeCircuitJson.svg")
  // Bun.write(
  //   "subtreeCircuitJson.svg",
  //   convertCircuitJsonToSchematicSvg(subtreeCircuitJson),
  // )

  // Convert the subtree circuit json into a bpc graph
  const floatingGraph = convertCircuitJsonToBpc(
    subtreeCircuitJson, // .concat(implicitNetLabels),
  )

  const floatingGraphNoNotConnected = {
    boxes: floatingGraph.boxes,
    pins: floatingGraph.pins.map((p) => ({
      ...p,
      color: p.color.replace("not_connected", "normal"),
    })),
  }

  const { result: laidOutBpcGraph } = layoutSchematicGraphVariants(
    [
      { variantName: "default", floatingGraph },
      {
        variantName: "noNotConnected",
        floatingGraph: floatingGraphNoNotConnected,
      },
    ],
    {
      singletonKeys: ["vcc/2", "gnd/2"],
      centerPinColors: ["netlabel_center", "component_center"],
      floatingBoxIdsWithMutablePinOffsets: new Set(
        floatingGraph.boxes
          .filter((box) => {
            const boxPins = floatingGraph.pins.filter(
              (p) => p.boxId === box.boxId,
            )
            const nonCenterBoxPins = boxPins.filter(
              (bp) => !bp.color.includes("center"),
            )
            if (nonCenterBoxPins.length <= 2) {
              return true
            }
            return false
          })
          .map((b) => b.boxId),
      ),
      corpus: {},
    },
  )

  if (debug.enabled && global?.debugGraphics) {
    global.debugGraphics?.push(
      getGraphicsForBpcGraph(laidOutBpcGraph, {
        title: `laidOutBpcGraph-${group.name}`,
      }),
    )
  }

  // Offset returned coordinates by the group's global schematic position so
  // that match-adapt layouts respect the group's schX/schY props
  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()

  // Extract the new positions
  for (const box of laidOutBpcGraph.boxes) {
    if (!box.center) continue
    const schematic_component = db.schematic_component.get(box.boxId)
    if (schematic_component) {
      const newCenter = {
        x: box.center.x + groupOffset.x,
        y: box.center.y + groupOffset.y,
      }
      const ports = db.schematic_port.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })
      const texts = db.schematic_text.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })

      const positionDelta = {
        x: newCenter.x - schematic_component.center.x,
        y: newCenter.y - schematic_component.center.y,
      }

      for (const port of ports) {
        port.center.x += positionDelta.x
        port.center.y += positionDelta.y
      }

      for (const text of texts) {
        text.position.x += positionDelta.x
        text.position.y += positionDelta.y
      }

      // Update schematic primitives (rects, lines, circles, arcs)
      updateSchematicPrimitivesForLayoutShift({
        db,
        schematicComponentId: schematic_component.schematic_component_id,
        deltaX: positionDelta.x,
        deltaY: positionDelta.y,
      })

      schematic_component.center = newCenter
      continue
    }

    const schematic_net_label = db.schematic_net_label.get(box.boxId)

    if (schematic_net_label) {
      const pin = laidOutBpcGraph.pins.find(
        (p) => p.boxId === box.boxId && p.color === "netlabel_center",
      )
      if (!pin) {
        throw new Error(`No pin found for net label: ${box.boxId}`)
      }
      const finalCenter = {
        x: box.center.x + groupOffset.x,
        y: box.center.y + groupOffset.y,
      }
      schematic_net_label.center = finalCenter
      schematic_net_label.anchor_position = {
        x: finalCenter.x + pin.offset.x,
        y: finalCenter.y + pin.offset.y,
      }
      continue
    }

    console.error(
      `No schematic element found for box: ${box.boxId}. This is a bug in the matchAdapt binding with @tscircuit/core`,
    )
  }
}
