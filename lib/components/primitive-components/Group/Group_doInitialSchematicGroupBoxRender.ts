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
    schBox?: {
      title?: string
      refdes?: string
      width?: number
      height?: number
    }
  } = parsed

  if (
    !showAsSchematicBox ||
    !group?.subcircuit_id ||
    !group?.schematic_group_id
  )
    return

  const { db } = ctx
  const newId = (kind: string) =>
    db._newId
      ? db._newId(kind)
      : `${kind}_${Math.random().toString(36).slice(2)}`

  // 1) Create schematic component (logical box)
  const schematic_component_id = newId("schematic_component")
  db.push({
    type: "schematic_component",
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
    schematic_group_id: group.schematic_group_id,
    refdes: schBox?.refdes ?? parsed.name,
    title: schBox?.title ?? parsed.name,
    width: schBox?.width,
    height: schBox?.height,
  })

  // 2) Create visible schematic box tied to component
  db.push({
    type: "schematic_box",
    schematic_box_id: newId("schematic_box"),
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
  })

  // 3) Helper to resolve internal port's SCK via selector
  const sckOf = (selector: string): string | undefined => {
    const port = group.selectOne?.(selector, { type: "port" })
    return (
      port?.source_port?.subcircuit_connectivity_map_key ??
      port?.subcircuit_connectivity_map_key
    )
  }

  // 4) Emit ports on the box
  const pushPort = (alias: string, side: Side, orderIndex: number) => {
    const sel = connections[alias]
    if (!sel) return
    const sck = sckOf(sel)
    if (!sck) return

    db.push({
      type: "schematic_port",
      schematic_port_id: newId("schematic_port"),
      schematic_component_id,
      subcircuit_id: group.subcircuit_id,
      name: alias,
      side,
      order_index: orderIndex,
      subcircuit_connectivity_map_key: sck,
    })
  }

  // 5) Arrange pins per side with specified direction and gaps
  const sides: Side[] = ["left", "right", "top", "bottom"]
  const placed = new Set<string>()

  sides.forEach((side) => {
    const cfg = schPinArrangement?.[side]
    if (!cfg) return

    let pins = [...cfg.pins]
    if (
      cfg.direction === "bottom-to-top" ||
      cfg.direction === "right-to-left"
    ) {
      pins.reverse()
    }

    let idx = 0
    pins.forEach((alias) => {
      pushPort(alias, side, idx++)
      if (cfg.gapAfterPins?.includes(alias)) idx++ // Add gap by incrementing index
      placed.add(alias)
    })
  })

  // 6) Place any unarranged aliases on the right side in insertion order
  let extraIdx = 0
  Object.keys(connections).forEach((alias) => {
    if (!placed.has(alias)) pushPort(alias, "right", extraIdx++)
  })

  // 7) Cleanup - remove or detach other schematic components from this subcircuit except the box just created
  try {
    let allSchematicComponents: any[] = []
    if (db.schematic_component?.getWhere) {
      allSchematicComponents = db.schematic_component.getWhere({
        subcircuit_id: group.subcircuit_id,
      })
    } else {
      allSchematicComponents = (db.toArray?.() ?? []).filter(
        (e: any) =>
          e.type === "schematic_component" &&
          e.subcircuit_id === group.subcircuit_id,
      )
    }

    allSchematicComponents.forEach((component) => {
      if (component.schematic_component_id === schematic_component_id) return
      if (db.schematic_component?.delete) {
        db.schematic_component.delete(component.schematic_component_id)
      } else if (db.delete) {
        db.delete(component)
      } else if (db.schematic_component?.update) {
        db.schematic_component.update(component.schematic_component_id, {
          schematic_group_id: undefined,
        })
      }
    })
  } catch {
    // ignore errors to be resilient in tests or unexpected states
  }
}
