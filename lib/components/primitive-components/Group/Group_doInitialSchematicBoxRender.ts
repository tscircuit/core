import type { Group } from "./Group"
import { resolveBoxConnections } from "./_resolveBoxConnections"

// get db handle in the same way your other passes do
const getDb = (g: any) => g.db ?? g._db ?? g.getDb?.() ?? g.getRoot?.()?.db

export function Group_doInitialSchematicBoxRender(group: Group) {
  if (!group.isSchematicBox()) return
  if (!group.subcircuit_id) return

  const db: any = getDb(group)
  if (!db) throw new Error("No db handle in Group_doInitialSchematicBoxRender")

  // 1) create the schematic_component = the box
  const comp = db.schematic_component.insert({
    is_schematic_group: true, // additive flag
    subcircuit_id: group.subcircuit_id,
    name: group.getBoxTitle(),
    box_shape: group.getSchBox()?.shape ?? "rect",
  })

  // 2) resolve boxPinName -> SCK
  const resolved = resolveBoxConnections(group)

  // 3) side & order from arrangement (fallback: left, alphabetical)
  const arrange = group.getSchPinArrangement()
  const bySide: Record<"left" | "right" | "top" | "bottom", string[]> = {
    left: arrange?.leftSide?.pins ?? [],
    right: arrange?.rightSide?.pins ?? [],
    top: arrange?.topSide?.pins ?? [],
    bottom: arrange?.bottomSide?.pins ?? [],
  }
  const allNames = new Set(resolved.map((r) => r.pinName))
  const already = new Set(Object.values(bySide).flat())
  const missing = [...allNames].filter((n) => !already.has(n)).sort()
  bySide.left.push(...missing)

  // 4) emit pins
  ;(["left", "right", "top", "bottom"] as const).forEach((side) => {
    bySide[side].forEach((pinName, idx) => {
      const r = resolved.find((x) => x.pinName === pinName)
      if (!r) return
      db.schematic_pin.insert({
        parent_component_id: comp.schematic_component_id,
        group_box_pin_name: pinName, // additive fields
        group_box_side: side,
        group_box_order_index: idx,
        subcircuit_connectivity_map_key: r.sck, // existing SCK ecosystem
      })
    })
  })
}
