These TSX fixtures adapt the Level 1–3 boards from [RFC #26](https://github.com/tscircuit/rfc/pull/26). The differential board names its trunks and routes termination/supply taps in a separate phase, as required by the current autorouter. Voltage sources use core's `pin1`/`pin2` terminal names.

The boards reference the real TI models. Vendor files are not redistributed. To exercise validation against the actual IBIS contents, download/extract these files and run:

```sh
SI_IBIS_MODEL_DIR=/path/to/models bun test tests/features/signal-integrity
```

- `sn74lvc1g04.ibs`: [TI SCEM216C](https://www.ti.com/lit/zip/scem216c), `SN74LVC1G04_IBIS/sn74lvc1g04.ibs`, SHA-256 `03033638d7fe8bf268428be133a5aad63aae0145980113561b20ab92063e2c00`.
- `sn65hvd72.ibs`: [TI SLLM183](https://www.ti.com/lit/zip/sllm183), `SN65HVD72_IBIS/sn65hvd72.ibs`, SHA-256 `293f71f8d6c8764914a73564ebbb5b9e0e706d9dcc18d87aae91f1def06ca47e`.

The test fixture supplies these files through the existing `platformFetch` hook. Without that directory, tests validate the emitted asset references and skip only tests requiring IBIS contents. No test invokes an SI solver.
