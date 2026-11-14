# CC2340R5 reference fixture

Source: [ShiboSoftwareDev/cc2340r5-reference-design 1.4.0](https://tscircuit.com/ShiboSoftwareDev/cc2340r5-reference-design/customize?package_release_id=bff7bbb1-c0df-4b3e-8cb2-5f5c706caa87&preview_file=dist%2Findex%2Fcircuit.json#schematic),
release `bff7bbb1-c0df-4b3e-8cb2-5f5c706caa87`, retrieved 2026-11-12.
The upstream author extracted this circuit from `imrishabh18/pedometer` 1.1.8.

`imports/` preserves the release's actual part definitions. `index.tsx` adapts
its `index.circuit.tsx` to a standalone subcircuit at the published defaults:
external LF crystal and debug header fitted, 2.5 V supply, 10 µF input bulk
capacitor, and 100 kΩ reset pull-up. All 27 components, their values, physical
pin mappings, 16 nets, and RF/clock/power/debug topology are retained.

The module adaptation replaces the board with a subcircuit, omits board-only
routing/frame settings and the fixed A4 sheet, and freezes the published defaults.
It exports VDDS, GND, RESET_N, SWDIO, SWCLK and eight GPIOs: DIO8, DIO11, DIO12,
DIO13, DIO20_A11, DIO21_A10, DIO24_A7, and DIO6_A1. These GPIOs were marked
unconnected in the published board; the adaptation removes those NC declarations
and adds eight named nets connected to U1 pins 3, 4, 5, 6, 9, 10, 12, and 19.
These are the actual RGE package pins in the imported part definition (see the
[TI CC2340R5 datasheet](https://www.ti.com/lit/ds/symlink/cc2340r5.pdf)).
The LF crystal remains fitted, so its pins are not exported as GPIOs.

The resulting 13-terminal interface is a proposed reusable module, not an
interface already declared by the published board. U1's symbol is taller and
its pin arrangement aligns all exported pins with the left boundary. Core
places the terminals and routes their connections; no SVG geometry is patched.
React keys are carried on Fragments to match this repository's intrinsic JSX types.

`published-electrical-signature.json` is the immutable signature extracted from
the release's actual `dist/index/circuit.json`. `module-electrical-signature.ts`
adds only the eight GPIO nets. Tests compare all 27 component identities/values,
all 16 original nets, and the eight new nets against this explicit expected
signature. `expect-wired-interface.ts` additionally traverses emitted wire edges
from every public terminal to its actual MCU pin, without treating net labels
as wire connections, and verifies each boundary wire's source trace reference.
