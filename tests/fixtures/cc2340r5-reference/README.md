# CC2340R5 reference fixture

Source: [ShiboSoftwareDev/cc2340r5-reference-design 1.4.0](https://tscircuit.com/ShiboSoftwareDev/cc2340r5-reference-design/customize?package_release_id=bff7bbb1-c0df-4b3e-8cb2-5f5c706caa87&preview_file=dist%2Findex%2Fcircuit.json#schematic),
release `bff7bbb1-c0df-4b3e-8cb2-5f5c706caa87`, retrieved 2026-11-12.
The upstream author extracted this circuit from `imrishabh18/pedometer` 1.1.8.

`imports/` preserves the release's actual part definitions. `index.tsx` adapts
its `index.circuit.tsx` to a standalone subcircuit at the published defaults:
external LF crystal and debug header fitted, 2.5 V supply, 10 µF input bulk
capacitor, and 100 kΩ reset pull-up. All 27 components, their values, physical
pin mappings, 16 nets, and RF/clock/power/debug topology are retained.

Adaptations are limited to the container and interface: replace the board with
a subcircuit; omit board-only routing/frame settings and the fixed A4 sheet so
the module boundary defines the viewport; freeze the published parameter
defaults; and export the existing VDDS, GND, RESET_N, SWDIO, and SWCLK nets.
These five exports are the proposed module interface, not a claim that the
published board already declares public ports. React keys are carried on
Fragments to match this repository's intrinsic JSX types.

`published-electrical-signature.json` was extracted from the release's actual
`dist/index/circuit.json`. Tests compare component identities/values and every
named net's physical component-pin membership against it. New public ports
are omitted from this comparison; internal connections must remain identical.
