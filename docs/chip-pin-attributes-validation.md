# Chip pin attributes compared with fetched metadata

Each chip compares explicitly declared `pinAttributes` with the original
fetched part's electrical pin metadata, before user overrides merge into the
rendered source ports. For example, declaring `requiresVoltage: "1.8V"` for a
pin whose fetched `requires_voltage` is `3.3` produces a warning even though
the rendered source port still contains the user's `1.8` override.

A chip with conflicts gets one aggregate warning with up to three affected
pin examples, each showing the declared property/value and fetched field/value.
A count reports any additional affected pins, and `source_port_ids` includes
all affected pins. Rechecking updates the same warning; correcting declarations
or disabling checks removes it.

```text
Chip U1 has pinAttributes that conflict with fetched pin metadata on 1 pin: VDD (requiresVoltage: "1.8V", fetched requires_voltage: 3.3). Check the chip configuration against the part datasheet.
```

Pin matching reuses source rendering's rules: physical pin numbers take
precedence, with names and aliases as a fallback. Ambiguous ownership or pin
matches are not guessed. Comparison normalizes voltage units, so `"3300mV"`
agrees with fetched `3.3`, and handles explicit `false` and zero values.

Only explicit declarations and known fetched fields can conflict. Omitted
attributes inherit imported defaults and are not mismatches. An absent
fetched field is unknown, not `false`. Display properties are not electrical
facts. A declared `capabilities` list replaces the imported supported set,
including an empty list. Active capabilities and output modes may differ
from fetched default configuration; they warn only if the part explicitly
does not support the selected capability or mode. `noConnect` intentionally
leaves a usable pin unconnected and is not an electrical mismatch declaration.

The check runs in each chip's source lifecycle, after asynchronous imports
settle, without requiring a board or PCB/schematic rendering. It reuses
imported pin metadata when available. With a custom footprint (or no footprint)
and explicit `pinAttributes`, a configured parts engine can fetch datasheet
metadata using the chip's supplier or manufacturer part number. This fetch
supplies comparison facts only: it does not import the official footprint or
change the user's declarations, pin labels, or source-port defaults.

Repeated chips share metadata requests by supplier part number, manufacturer
part number, and fetch implementation within the circuit instance. Pending
requests, successful results, missing metadata, and failed attempts are retained,
including the complete legacy fallback sequence. This also shares requests
between supplier footprint imports and custom-footprint validation. A fallback
still produces an individual diagnostic for each chip rather than reusing the
first chip's name. A newly created circuit gets a fresh cache and can retry
failed parts; failures are not persisted across circuit instances.

Without fetched electrical metadata, the comparison cannot verify accuracy
against a datasheet. Failed optional metadata fetches do not prevent custom
footprints rendering. The checks respect `drcChecksDisabled`,
`pinSpecificationDrcChecksDisabled`, and `partsEngineDisabled` for new fetches.
Resistors, capacitors, inductors, and other non-chip components do not run
this validation or its additional metadata fetches. Their existing checks and
footprint/BOM fetching remain unchanged.

For compatibility with existing Circuit JSON consumers, the aggregate uses
`source_component_pins_underspecified_warning`. The existing all-underspecified,
missing-power, and missing-ground checks also run within each chip rather than
on the board. A fetched-metadata conflict replaces those legacy chip-pin
warnings with the single conflict summary; otherwise their behavior is kept.
