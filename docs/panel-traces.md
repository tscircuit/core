# Electrical traces across a panel

Place a `<trace>` directly inside `<panel>` or `<subpanel>` to connect ports on
its child boards. Qualify each port selector with the board name:

```tsx
<panel width={40} height={20} layoutMode="grid" col={2}>
  <board name="B1" width={10} height={10}>
    <resistor name="R1" resistance="1k" footprint="0805" />
  </board>
  <board name="B2" width={10} height={10}>
    <resistor name="R2" resistance="1k" footprint="0805" />
  </board>
  <trace name="panel_link" from=".B1 .R1 .pin2" to=".B2 .R2 .pin1" />
</panel>
```

The default autorouter routes after board placement and preserves existing board
copper. `pcbStraightLine`, `pcbPath`, and `pcbPaths` work with the same semantics
as board traces. Numeric manual-path points remain relative to the anchor port's
component; selector points resolve to the final placed ports. Emitted routes
contain circuit-world points in millimeters in a right-handed frame: +X right,
+Y top, +Z above the panel.

Panel traces retain source electrical connectivity and emit ordinary `pcb_trace`
records with `pcb_panel_id`. Physical vias on these traces carry the same panel
reference. Traces inside child boards remain board-owned. Board schematics remain
independent; panel traces do not draw schematic connections across boards.

Panel routing uses the panel's outer dimensions (or the nested subpanel's bounds)
and includes generated routing cutouts and mouse-bite holes as obstacles. A routed
cutout cannot carry copper: use a panelization layout with intact material along
the intended electrical connection. `pcbStraightLine` is an explicit manual
route and does not search around obstacles. Panel routing currently uses the
existing two-layer panel stack; child boards retain their own layer settings.
