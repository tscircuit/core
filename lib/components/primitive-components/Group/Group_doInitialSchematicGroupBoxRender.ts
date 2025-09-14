// lib/components/primitive-components/Group/Group_doInitialSchematicGroupBoxRender.ts

type Side = "left" | "right" | "top" | "bottom";
type SideCfg = {
  direction?:
    | "top-to-bottom"
    | "bottom-to-top"
    | "left-to-right"
    | "right-to-left";
  pins: string[];
  gapAfterPins?: string[];
};
type SchPinArrangement = Partial<Record<Side, SideCfg>>;

/**
 * Render a single-box schematic representation for a <group subcircuit ...>.
 * - creates a schematic_component (logical)
 * - creates a schematic_box (the rectangle)
 * - creates schematic_port alias pins, each linked via subcircuit_connectivity_map_key (SCK)
 * - assigns the component to the already-created schematic_group of this group
 *
 * Assumes Group.ts has already created this.schematic_group_id for the group and that
 * Group_doInitialSourceAddConnectivityMapKey ran earlier (so internal ports/nets have SCK).
 */
export function Group_doInitialSchematicGroupBoxRender(group: any, ctx: any) {
  const {
    showAsSchematicBox,
    connections = {},
    schPinArrangement,
    schBox,
  } = group._parsedProps;

  if (!showAsSchematicBox) return;
  if (!group.subcircuit_id) return;
  if (!group.schematic_group_id) return;

  const db = ctx.db;

  // 1) Create the logical schematic component for the box
  const schematic_component_id = typeof db._newId === 'function'
    ? db._newId("schematic_component")
    : `schematic_component_${Math.random().toString(36).slice(2)}`;

  db.push({
    type: "schematic_component",
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
    schematic_group_id: group.schematic_group_id, // attach to THIS group's schematic group
    refdes: schBox?.refdes ?? group._parsedProps.name ?? undefined,
    title: schBox?.title ?? group._parsedProps.name ?? undefined,
    width: schBox?.width,   // optional; your layout pass can place/size later
    height: schBox?.height, // optional
  });

  // 2) Visual rectangle tied to that component
  const schematic_box_id = db._newId
    ? db._newId("schematic_box")
    : `schematic_box_${Math.random().toString(36).slice(2)}`;

  db.push({
    type: "schematic_box",
    schematic_box_id,
    schematic_component_id,
    subcircuit_id: group.subcircuit_id,
  });

  // 3) Helper: resolve internal port's SCK via your existing selector plumbing
  const sckOf = (sel: string): string | undefined => {
    // core already supports group.selectOne(selector, { type: "port" })
    const p = group.selectOne(sel, { type: "port" }) as any;
    return (
      p?.source_port?.subcircuit_connectivity_map_key ??
      p?.subcircuit_connectivity_map_key ??
      undefined
    );
  };

  // 4) Emit schematic ports for each alias
  const pushPort = (alias: string, side: Side, order_index: number) => {
    const sel = (connections as Record<string, string>)[alias];
    if (!sel) return;
    const sck = sckOf(sel);
    if (!sck) return; // you could warn here if you want

    const schematic_port_id = db._newId
      ? db._newId("schematic_port")
      : `schematic_port_${Math.random().toString(36).slice(2)}`;

    db.push({
      type: "schematic_port",
      schematic_port_id,
      schematic_component_id,
      subcircuit_id: group.subcircuit_id,
      name: alias,
      side,
      order_index,
      subcircuit_connectivity_map_key: sck,
    });
  };

  // 5) Place arranged pins (left/right/top/bottom + direction)
  const sides: Side[] = ["left", "right", "top", "bottom"];
  const placed = new Set<string>();

  for (const side of sides) {
    const cfg = schPinArrangement?.[side] as SideCfg | undefined;
    if (!cfg) continue;

    let pins = [...cfg.pins];
    if (cfg.direction === "bottom-to-top" || cfg.direction === "right-to-left") {
      pins.reverse();
    }

    let idx = 0;
    for (const alias of pins) {
      pushPort(alias, side, idx++);
      if (cfg.gapAfterPins?.includes(alias)) idx++; // leave a spacer slot
      placed.add(alias);
    }
  }

  // 6) Any remaining aliases go on the right side
  let k = 0;
  for (const alias of Object.keys(connections)) {
    if (!placed.has(alias)) pushPort(alias, "right", k++);
  }
}
