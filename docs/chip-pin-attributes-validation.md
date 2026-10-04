# Chip pin attribute warnings

Rendering checks each chip's resolved electrical pin attributes. A chip with
one or more issues receives a single
`source_component_pins_underspecified_warning`. Its message includes the number
of affected pins, up to three examples with reasons, and a count of remaining
pins. `source_port_ids` references every affected existing pin, even when the
message omits it.

For example, a chip with an empty entry for `DATA` and no entry for `ENABLE`
produces a warning like:

```text
Chip U1 has pinAttributes issues affecting 2 pins: DATA (missing electrical role in pinAttributes), ENABLE (missing electrical role in pinAttributes). Specify an electrical role for each pin and correct inconsistent attributes.
```

A pin needs a declared electrical role: input, output, bidirectional, passive,
GPIO, power, ground, voltage, a supported or active protocol capability, or
`doNotConnect`. Empty objects, all-false role flags, and display-only attributes
such as `highlightColor` do not describe its electrical role. Zero volts is a
valid voltage declaration. Optional attributes, such as a voltage on a power
pin, are not universally required.

The checks also identify:

- `doNotConnect` together with `mustBeConnected`.
- A ground pin with a nonzero required or provided voltage.
- An enabled operating mode whose corresponding capability is explicitly
  false, such as `isUsingOpenDrain: true` and `canUseOpenDrain: false`.
- Attribute keys that do not match any chip pin or alias.
- Unknown attribute field names, such as `isOuput` instead of `isOutput`.

Imported pin attributes supply defaults and explicit user attributes override
them. Pin names, numeric pin identifiers, and aliases all match the same physical
pin. `noConnect` satisfies the electrical-role check without a separate
`pinAttributes` entry. A missing capability is treated as unknown, so enabling
an operating mode does not require every corresponding `canUse…` flag.

The warning is updated rather than duplicated when checks rerun, and removed
when the issues are resolved. It respects `drcChecksDisabled` and
`pinSpecificationDrcChecksDisabled`. Other component types keep their existing
checks. Invalid prop types still follow normal prop-schema validation.

These checks validate the declarations, not their accuracy against the real
part's datasheet. They cannot discover physical pins absent from the component
definition or confirm footprint geometry and pin-to-pad mapping.
