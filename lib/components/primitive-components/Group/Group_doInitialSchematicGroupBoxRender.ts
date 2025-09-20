// lib/components/primitive-components/Group/Group_doInitialSchematicGroupBoxRender.ts

type Side = "left" | "right" | "top" | "bottom"

type SideCfg = {
  direction?:
    | "top-to-bottom"
    | "bottom-to-top"
    | "left-to-right"
    | "right-to-left"
  pins: string[]
  gapAfterPins?: string[]
}

type SchPinArrangement = Partial<Record<Side, SideCfg>>

/**
 * Render one schematic "box" component for a <group subcircuit ...>
 * and expose alias pins mapped to internal ports via subcircuit_connectivity_map_key (SCK).
 *
 * Assumes:
 * - Group.ts has already created this.schematic_group_id for the group
 * - Group_doInitialSourceAddConnectivityMapKey ran earlier so internal ports/nets have SCK
 *
 * Also performs a post-pass cleanup to remove/detach any previously created
 * child schematic components within the same subcircuit, ensuring the schematic
 * shows only the single box representation.
 */
export function Group_doInitialSchematicGroupBoxRender(group: any, ctx: any) {
  const parsed = group?._parsedProps ?? {}
  const {
    showAsSchematicBox,
    connections = {},
    schPinArrangement,
    schBox,
  }: {
    showAsSchematicBox?: boolean
    connections?: Record<string, string>
    schPinArrangement?: SchPinArrangement
    schBox?: { title?: string; refdes?: string; width?: any; height?: any }
  } = parsed

  if (!showAsSchematicBox) return
  if (!group?.subcircuit_id) return
  if (!group?.schematic_group_id) return

  const { db } = ctx
  const newId = (kind: string) =>
    db._newId
      ? db._newId(kind)
      : `${kind}_${Math.random().toString(36).slice(2)}`

  // 1) Create the logical schematic component (the box's component)
  const schematic_component_id = newId("schematic_component")

  db.push({
    type: "schematic_component",
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
    schematic_group_id: group.schematic_group_id, // attach to THIS group's schematic group
    refdes: schBox?.refdes ?? parsed?.name ?? undefined, // e.g., "SH1"
    title: schBox?.title ?? parsed?.name ?? undefined, // e.g., "Arduino Shield"
    width: schBox?.width,
    height: schBox?.height,
  })

  // 2) Visual rectangle tied to that component
  const schematic_box_id = newId("schematic_box")
  db.push({
    type: "schematic_box",
    schematic_box_id,
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
  })

  // 3) Helper to resolve an internal port's SCK via existing selectors
  const sckOf = (sel: string): string | undefined => {
    const p = group.selectOne?.(sel, { type: "port" })
    // Prefer source_port.sck if present; otherwise direct sck on port
    return (
      p?.source_port?.subcircuit_connectivity_map_key ??
      p?.subcircuit_connectivity_map_key ??
      undefined
    )
  }

  // 4) Emit ports on the box
  const pushPort = (alias: string, side: Side, order_index: number) => {
    const sel = (connections as Record<string, string>)[alias]
    if (!sel) return
    const sck = sckOf(sel)
    if (!sck) return

    const schematic_port_id = newId("schematic_port")
    db.push({
      type: "schematic_port",
      schematic_port_id,
      schematic_component_id,
      subcircuit_id: group.subcircuit_id,
      name: alias,
      side,
      order_index,
      subcircuit_connectivity_map_key: sck,
    })
  }

  // 5) Arrange ports per side
  const sides: Side[] = ["left", "right", "top", "bottom"]
  const placed = new Set<string>()

  for (const side of sides) {
    const cfg = schPinArrangement?.[side] as SideCfg | undefined
    if (!cfg) continue

    let pins = [...cfg.pins]
    if (
      cfg.direction === "bottom-to-top" ||
      cfg.direction === "right-to-left"
    ) {
      pins.reverse()
    }

    let idx = 0
    for (const alias of pins) {
      pushPort(alias, side, idx++)
      if (cfg.gapAfterPins?.includes(alias)) idx++ // spacer
      placed.add(alias)
    }
  }

  // 6) Any remaining aliases go on the right side
  let k = 0
  for (const alias of Object.keys(connections)) {
    if (!placed.has(alias)) pushPort(alias, "right", k++)
  }

  // 7) CLEANUP: remove/detach any existing child schematic components in this subcircuit
  //    so only the single box remains in the group's schematic view.
  try {
    // Collect all schematic components in this subcircuit except the box we just created
    const allSC = db.schematic_component?.getWhere
      ? db.schematic_component.getWhere({ subcircuit_id: group.subcircuit_id })
      : (db.toArray?.() ?? []).filter(
          (e: any) =>
            e.type === "schematic_component" &&
            e.subcircuit_id === group.subcircuit_id,
        )

    const others = allSC.filter(
      (c: any) => c?.schematic_component_id !== schematic_component_id,
    )

    for (const c of others) {
      // Prefer deletion when supported; otherwise just detach from the group
      if (db.schematic_component?.delete) {
        db.schematic_component.delete(c.schematic_component_id)
      } else if (db.delete) {
        db.delete(c)
      } else if (db.schematic_component?.update) {
        db.schematic_component.update(c.schematic_component_id, {
          schematic_group_id: undefined,
        })
      }
    }
  } catch {
    // keep resilient in tests
  }
}
