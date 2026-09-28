# TI SRJ repro fixtures

These fixtures are record-for-record extracts of the Circuit JSON generated
from TI's public Altium reference designs. No coordinates, dimensions,
connectivity identifiers, or routes were synthesized for the tests.

- `ti-pmp22650-imported-arc-crop.circuit.json` contains the real PMP22650
  board record, every component/pad/via in the 205–213 mm by 42–52 mm crop,
  and the exact imported arc `pcb_trace_altium_arc_4291` that breaks fresh SRJ
  extraction.
- `ti-pmp23653-planar-transformer.circuit.json` contains the real PMP23653
  planar-transformer board, source topology, components, ports, plated holes,
  vias, and copper traces. Decorative-only fabrication and silkscreen records
  are omitted because they do not participate in SRJ generation.

Each test renders the extracted TI layout in its snapshot so a reviewer can
inspect the physical board involved in the failure without relying only on
numeric assertions.
