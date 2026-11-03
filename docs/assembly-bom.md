# Assembly BOM from TSX

Physical assembly elements emit `cad_assembly_bom_item` records alongside their
source and CAD records. A model is optional for `assembly.part`, so screws,
adhesives and other unmodeled materials can appear in the BOM.

```tsx
import { assembly, Circuit } from "@tscircuit/core"

const circuit = new Circuit()
circuit.add(
  <assembly.device name="sensor">
    <assembly.subassembly
      name="housing"
      displayName="ABS enclosure"
      purchaseUrls={["https://amazon.com/dp/example", "https://store.example/enclosure"]}
    >
      <assembly.part name="screws" purchaseUrls={["https://store.example/m3"]} />
      <assembly.part name="module" supplierPartNumbers={{ jlcpcb: ["C123", "C456"] }} />
    </assembly.subassembly>
  </assembly.device>,
)
await circuit.renderUntilSettled()
const circuitJson = circuit.getCircuitJson()
```

Each assembly element emits a BOM quantity of one, independent of its number
of CAD models. Use
`convertCircuitJsonToAssemblyBom({ circuitJson })` from the converter PR to obtain
the nested display model, or pass `circuitJson` directly to Runframe's BOM UI.
`tests/assembly/fixtures/assembly-bom.tsx` is a complete reusable TSX fixture with
multiple CAD models for one material. An integration test renders that fixture
and passes its actual output to the converter.

## Ownership and defaults

- Each part, bolt, printed part, motor, screen, cable and subassembly gets one
  material record. `assembly.cadassembly` follows the subassembly alias.
- `assembly.device` stays transparent when it has neither a model nor explicit
  BOM metadata. Supplying `purchaseUrls` or `supplierPartNumbers`
  opts the device into a BOM line. An explicitly empty array/map still opts in.
- Parent IDs come from the nearest material ancestor in the component tree.
  Mounting selectors affect placement, not BOM ownership.
- Local quantity is always 1. `displayName` is used where supported, otherwise
  `name`. The BOM identity stays stable when purchasing metadata changes.
- Each record references its source and all CAD components owned by that source,
  excluding descendants' source records. Cables currently have a `cad_cable`
  rather than a source/CAD-component record, so their BOM entries omit those
  optional references. No new cable reference field is invented.
- BOM rendering runs after CAD generation and waits for asynchronous geometry.
  It also runs with PCB rendering disabled. Unmodeled parts remain valid.
- CAD primitives, reference surfaces, drawings and explosion instructions do not
  create extra material lines. Parent and child materials remain independent;
  parentage does not imply a purchasing mode or suppress descendant cost.

Purchase links and supplier SKUs are preserved independently. Core performs no
pricing lookups. Existing electronic components still use the converter's PCB
fallback; assembly materials do not enter manufacturing BOM/placement exports.

## Review dependencies

This draft uses the published Circuit JSON schema and pins the props preview
from https://github.com/tscircuit/props/pull/973. Its converter integration test
pins https://github.com/tscircuit/circuit-json-to-bom-csv/pull/47. Replace those
preview dependencies with published versions before merging.
