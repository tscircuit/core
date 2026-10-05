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

## Public board compatibility study

Inspected six public packages from tscircuit.com using the registry's
`package_releases/get_filesystem_map` endpoint. Instantiated their source
components to retain repeated instances, then replayed their electrical
declarations through this branch's source-only rendering. Supplier results
were captured using `@tscircuit/parts-engine@0.0.36` and replayed locally;
registry datasheet responses were also checked independently. These counts
describe new validation lookups with custom footprints, not total BOM, model,
or footprint traffic. They do not measure PCB routing or schematic layout.

| Public board | Chips with explicit attributes | Distinct validation lookups |
| --- | ---: | ---: |
| [nRF smart watch](https://tscircuit.com/seveibar/nrf-smart-watch) | 4 | 4 |
| [RP2040 motor controller](https://tscircuit.com/imrishabh18/rp2040-motor-controller) | 13 | 10 |
| [Wi-Fi smart switch](https://tscircuit.com/abse/wifi-smart-switch) | 1 | 1 |
| [Gameboy](https://tscircuit.com/abse/gameboy) | 0 | 0 |
| [AM3352/RAM](https://tscircuit.com/seveibar/am3352-ram-dogbone-and-single-layer-route-test) | 0 | 0 |
| [F1C100S carrier](https://tscircuit.com/seveibar/f1c100s-linux-dev-board) | 6 | 6 |

The F1C100S carrier inflates its processor module from stored Circuit JSON and
adds declarations in a ref callback. Its processor declarations were replayed
separately against the registry's F1C100S metadata, rather than using the stored
board output as reference facts. That adds one distinct lookup and produces
one aggregate warning covering four pins:

| Physical pin | Board declaration | Registry and Allwinner datasheet |
| --- | --- | --- |
| 48 / PE1 | `i2c_scl`, `uart_tx` | `i2c_sda`, `uart_tx` |
| 49 / PE0 | `i2c_sda`, `uart_rx` | `i2c_scl`, `uart_rx` |
| 63 / TPY2 | `uart_rx`, `spi_sck` | `uart_tx`, `spi_miso` |
| 64 / TPY1 | `uart_tx`, `spi_miso` | `uart_rx`, `spi_sck` |

These differences were confirmed against section 4.2 of the
[Allwinner F1C100s Datasheet Rev 1.0](https://linux-sunxi.org/images/b/ba/F1C100s_Datasheet_V1.0.pdf).
The public-board regression preserves these physical pin numbers, verifies
four affected ports and three warning examples, and verifies that two
processor instances share one fetch. It adds no visual snapshots.

No other fetched-fact conflicts appeared in the sampled declarations. This
does not establish that every chip is correct: most sampled parts had no
registry electrical attributes. In particular, the nRF watch's three ICs and
the motor controller's AP2112 regulator use underscore-form part numbers
that differ from supplier-reported names. Parts-engine rejects enrichment
for those identities, and core's fallback identity guard also rejects them.
Custom footprints can still render, but those pins cannot be verified.
The carrier's three manufacturer-only regulators also returned no supplier
result, even though direct registry queries contained electrical facts.

Two operational limitations are visible in these boards:

- Exclusion follows the component primitive. The watch declares its antenna
  as `<chip>`, and the motor controller declares its ABM8 crystal as `<chip>`.
  Both receive a lookup despite being physical passives. Actual resistor,
  capacitor, inductor, and crystal primitives receive no validation lookup.
- A custom-footprint metadata request uses `fetchPartCircuitJson`, so the
  JLC engine also requests supplier geometry and a 3D model. For example,
  RP2040's enrichment requested EasyEDA search, component data, a model OBJ,
  and the registry datasheet. Repeated parts share this work within a circuit,
  but every distinct requested part can still incur it. A supplier-independent
  electrical-metadata API would avoid this extra supplier/model traffic and
  the manufacturer-only supplier lookup prerequisite.

Full-board rendering was not established by this study: importing the bundled
public modules into the local React renderer hit integration errors before
validation ran. The successful checks above are isolated declaration replays,
including the processor's separately patched attributes.
