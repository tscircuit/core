# Board stackups

`fabricatorPreset` selects the fabricator family for physical stackup lookup.
All four JLCPCB presets (`jlcpcb_economy`, `jlcpcb_standard`, and their
`_20260912` variants) use the same JLCPCB template table, keyed by copper layer
count, nominal thickness in mm, and material. For example:

```tsx
<board layers={4} thickness="1.6mm" fabricatorPreset="jlcpcb_standard" />
```

The sourced entry is JLCPCB `JLC04161H-3313` for four copper layers, nominal
1.6 mm thickness, and FR-4 (the default material). Its construction comes from
[this fabrication stackup](https://raw.githubusercontent.com/tscircuit/am3352-sbc/837245bceb6ac898fd5451507d6b2b8024095fe7/design/fabrication-stackup.json).
Circuit JSON preserves the actual dielectric material names, including
`3313 RC57%` and `NP-155F core`. The nominal thickness is the lookup key;
the sourced physical layers sum to 1.5642 mm. No unsourced soldermask,
plated-hole copper thickness, or loss tangent is added.

A matching board emits one `pcb_stackup` associated with its `pcb_board_id`.
Without `fabricatorPreset`, no stackup is generated. Unsupported combinations
(such as two layers, 1.2 mm thickness, or flex material) also generate no
stackup and no warning or error. Existing board thickness defaults remain
unchanged; specify 1.6 mm to select this template. Other constructions are
omitted until their exact values can be sourced.

For `<board circuitJson={...}>`, an imported `pcb_stackup` belonging to the
imported board takes precedence, even without a preset or when the supplied
props have no matching template. It is copied and associated with the rendered
board ID. Otherwise, the board's `fabricatorPreset` selects a template using
the imported `pcb_board`'s `num_layers`, `thickness`, and `material` (FR-4 when
absent). Imported JSON is never mutated, and each board has at most one stackup.
