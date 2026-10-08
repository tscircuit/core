# TI SRJ obstacle-connectivity repro

This fixture is a record-for-record extract of the Circuit JSON generated from
TI's public PMP23653 Altium reference design. No coordinates, dimensions, or
connectivity identifiers were synthesized for the test.

- `ti-pmp23653-planar-transformer.circuit.json` contains the real PMP23653
  planar-transformer board, source topology, components, ports, plated holes,
  vias, and copper traces. Decorative-only fabrication and silkscreen records
  are omitted because they do not participate in SRJ generation.

The test renders the extracted layout and reports how current `main` copies a
whole physical net into every fresh-routing obstacle. This is the same
quadratic connectivity expansion that makes the larger PMP22650 sample exceed
its routing budget.
