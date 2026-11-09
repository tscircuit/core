These TSX fixtures adapt the Level 1–3 boards and the AM335x/Winbond DDR3 write example from [RFC #28](https://github.com/tscircuit/rfc/pull/28), pinned at `d79a8d14d40765b2dda7db557e45e101f2aa62ba`. The differential board routes trunks before termination/supply taps. The inverter is the SOT23-5 DBV package (`LVC1G04_DBV`).

Vendor files are not redistributed. Download/extract the real model files into one directory (symlinks work), then run:

```sh
SI_IBIS_MODEL_DIR=/path/to/models bun test tests/features/signal-integrity
```

- `sn74lvc1g04.ibs`: [TI SCEM216C](https://www.ti.com/lit/zip/scem216c), `SN74LVC1G04_IBIS/sn74lvc1g04.ibs`, SHA-256 `03033638d7fe8bf268428be133a5aad63aae0145980113561b20ab92063e2c00`.
- `sn65hvd72.ibs`: [TI SLLM183](https://www.ti.com/lit/zip/sllm183), `SN65HVD72_IBIS/sn65hvd72.ibs`, SHA-256 `293f71f8d6c8764914a73564ebbb5b9e0e706d9dcc18d87aae91f1def06ca47e`.
- `sn74lvc8t245.ibs`: [TI SCEM494](https://www.ti.com/lit/zip/scem494), used for multiple data/strobe receivers on the same physical chip.
- `sprm552c.ibs`: [TI SPRM552](https://www.ti.com/lit/zip/sprm552), component `am335x_zcz`.
- `W631GG6MB-12.ibs`: Winbond W631GG6MB IBIS archive referenced by the RFC DDR3 example.

The fixture provides real model contents through `platformFetch`. Model-dependent tests are explicitly skipped when `SI_IBIS_MODEL_DIR` is absent; loader-error coverage still runs. Rendering SI without a loader, or with an unsuccessful loader, fails explicitly rather than skipping model diagnostics.

Assertions cover the exact source schemas, omitted automatic duration, explicit duration bounds, PRBS phase planning and validation, constant-to-quiet normalization, per-leg model overrides, strobe dependencies and receiving-chip identity, rail/shunt boundaries, late signals, and cached imports. SI-bearing subcircuits render on the destination board instead of using isolated caching. Cached source declarations are reconstructed and revalidated after inflation.

The DDR3 test renders the RFC TSX with string trace keys (required by core) and routing disabled by the test host. It reaches the documented coupled-package-model error; it does not claim a working DDR simulation. No test invokes an SI solver. Duration coverage, DC threshold/mask calculations, ideal rail compatibility, placed-model lowering, physical graph limitations, and result generation are checked by the separate pipeline.

Import `signalintegrity` from `@tscircuit/core` for the `.simulation`, `.signal`
and `.ibismodel` elements, following the existing `assembly.*` mechanism.
Selectors on `.signal` are `driverRef`, `receiverRef` and `strobeRef`.
Corners are `typical` (default), `minimum` and `maximum`. The renderer maps
those to the existing Circuit JSON `typ`/`min`/`max` corner data and reverses
that mapping when restoring cached declarations; record names and fields are
unchanged. Namespaced IBIS declarations have a dedicated real-IBIS regression
at every corner. Removed top-level hosts have no catalogue or JSX aliases.
