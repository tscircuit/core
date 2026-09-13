# Fabricator DRC providers

Configure an optional `fabricatorEngine` on the platform to run fabricator-specific
checks after a board's PCB routing and via generation. The engine follows the
same injection pattern as `partsEngine`:

```tsx
import { RootCircuit } from "@tscircuit/core"
import { fabricatorEngine } from "@tscircuit/fabricator-drc"

const circuit = new RootCircuit({ platform: { fabricatorEngine } })
circuit.add(
  <board width="10mm" height="10mm" fabricatorPreset="jlcpcb_economy">
    <via name="V1" holeDiameter="0.25mm" outerDiameter="0.6mm"
      fromLayer="top" toLayer="bottom" />
  </board>,
)
await circuit.renderUntilSettled()
```

The [fabricator-drc package](https://github.com/tscircuit/fabricator-drc) generates
`pcb_fabricator_extra_charge_warning` when JLCPCB economy or standard vias have
hole diameters below 0.3 mm. Exactly 0.3 mm is outside the warning condition.

Providers implement `FabricatorEngine` from `@tscircuit/props`:

```ts
const engine: FabricatorEngine = {
  runDrcChecks({ circuitJson, fabricatorPreset, pcbBoardId }) {
    // Inspect this board's subtree and return Circuit JSON diagnostic records.
    return []
  },
}
```

`runDrcChecks` may return records directly or a promise. Core inserts the results
through its existing DRC pipeline. Providers must not mutate the input. Circuit
JSON uses millimeters and world coordinates (+X right, +Y up, +Z above).

The provider is called once per completed board DRC pass, after routing settles.
It is skipped if no provider or preset is supplied, or when `drcChecksDisabled`
or `pcbDisabled` is set. Disabling routing alone still permits checks of manually
placed vias. Provider failures follow the existing asynchronous DRC error path.
