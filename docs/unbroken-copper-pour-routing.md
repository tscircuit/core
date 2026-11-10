# Reserve a reference plane during routing

Use `unbroken` on a copper pour to keep unrelated signal wires out of its
region while allowing through vias to cross it with antipads:

```tsx
<board layers={4} width="40mm" height="24mm">
  <copperpour layer="inner1" connectsTo="net.GND" unbroken />
  {/* Components and signal connections */}
</board>
```

With no explicit outline, the pour reserves its containing group's or board's
region. Signal wires can still use top, inner2, and bottom. A pour with an
explicit outline reserves that region rather than the entire layer. Matching
GND connections can escape into the plane.

A normal keepout prohibits copper and via placement in its region. A
board-sized inner-layer keepout therefore prevents through vias throughout the
board. Use an unbroken pour for a reference plane. Ordinary pours without
`unbroken` are filled after routing and do not reserve their layer beforehand.

Local routing receives these reservations as Simple Route JSON obstacles with
`isCopperPour: true`. Remote solve and job requests containing these reservations
also include `input_simple_route_json`, built before routing from the live
component tree. Requests without reservations keep their existing input format.
Remote servers must use this field for routing when supplied; reconstructing
the problem from `input_circuit_json` loses the plane intent because copper
pours have not rendered yet. Raw Circuit JSON remains available on requests
that previously included it for servers that need other board data.

The physical via span is independent of the reserved wire layers. Generated
vias span the board by default; `allowBlindAndBuriedVias` controls whether
shorter physical spans are permitted.
