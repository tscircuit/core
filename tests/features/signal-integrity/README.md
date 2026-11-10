These TSX fixtures adapt the Level 1–3 boards and the AM335x/Winbond DDR3 write example from [RFC #29](https://github.com/tscircuit/rfc/pull/29), pinned at `9adc0fe61105554abce7ff80056786d6d287818e`. The differential board routes trunks before termination/supply taps. The inverter is the SOT23-5 DBV package (`LVC1G04_DBV`).

Vendor files are not redistributed. Download/extract the real model files into one directory (symlinks work), then run:

```sh
SI_IBIS_MODEL_DIR=/path/to/models bun test tests/features/signal-integrity
```

- `sn74lvc1g04.ibs`: [TI SCEM216C](https://www.ti.com/lit/zip/scem216c), `SN74LVC1G04_IBIS/sn74lvc1g04.ibs`, SHA-256 `03033638d7fe8bf268428be133a5aad63aae0145980113561b20ab92063e2c00`.
- `sn65hvd72.ibs`: [TI SLLM183](https://www.ti.com/lit/zip/sllm183), `SN65HVD72_IBIS/sn65hvd72.ibs`, SHA-256 `293f71f8d6c8764914a73564ebbb5b9e0e706d9dcc18d87aae91f1def06ca47e`.
- `sn74lvc8t245.ibs`: [TI SCEM494](https://www.ti.com/lit/zip/scem494), used for multiple channel receivers on the same physical chip.
- `sprm552c.ibs`: [TI SPRM552](https://www.ti.com/lit/zip/sprm552), component `am335x_zcz`.
- `W631GG6MB-12.ibs`: Winbond W631GG6MB IBIS archive referenced by the RFC DDR3 example.

The fixture provides real model contents through `platformFetch`. Model-dependent tests are explicitly skipped when `SI_IBIS_MODEL_DIR` is absent; loader-error coverage still runs. Rendering SI without a loader, or with an unsuccessful loader, fails explicitly rather than skipping model diagnostics.

Assertions cover the exact source schemas, omitted automatic duration, explicit duration bounds, PRBS phase planning and validation, literal constant patterns and disabled drivers, per-leg model overrides, rail/shunt boundaries, late signals, and cached imports. SI-bearing subcircuits render on the destination board instead of using isolated caching. Cached source declarations are reconstructed and revalidated after inflation.

The DDR3 test renders the RFC TSX with string trace keys (required by core) and routing disabled by the test host. It reaches the documented coupled-package-model error; it does not claim a working DDR simulation. No test invokes an SI solver. Waveform coverage, ideal rail compatibility, placed-model lowering, physical graph limitations, and result generation are checked by the separate pipeline.

Import `simulation` from `@tscircuit/core` for `.pcbtransientchannelsimulation`, `.pcbchannel`
and `.ibismodel`, beside the existing return-current elements.
Selectors on `.pcbchannel` are `driverRef` and `receiverRef`. Numeric offsets
are seconds; UI strings use the channel bit rate. Core never fills automatic
`duration_s`. IBIS values always use the typical corner, ideal die rails with
package parasitics, and local chip ground for single-ended probes. Unlisted
nets stay passive. `allowUnroutedTraces` defaults to false and emits
`allow_unrouted_traces`; `driverDisabled` emits `driver_disabled: true` and
requires a disable state on every driver leg. Constant patterns retain their
literal bits, including after cached imports. Removed elements and props have
no aliases. Results are waveforms and RLGC only.
