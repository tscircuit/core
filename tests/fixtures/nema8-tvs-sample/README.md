# NEMA8 TVS PCB repro

A clear two-component reproduction of the VM-to-GND route in
[the real NEMA8 board, v1.0.48](https://tscircuit.com/ShiboSoftwareDev/nema8-20mm-dual-usbc-stepper-controller).

The capacitor and TVS retain their original identifiers, pad dimensions,
footprint silkscreen and intended source connections. For readability, both
footprints are placed on the top layer and spread apart, with VM pads above
GND pads. The faulty saved route is reduced to one direct segment from the
capacitor's VM pad to the TVS ground pad. This is a simplified reproduction,
not the original board layout.

| Pin | Original source port | Intended net |
| --- | --- | --- |
| C_VM_HF1.pin1 | source_port_155 | VM |
| C_VM_HF1.pin2 | source_port_156 | GND |
| D_VM_TVS.pin1 (cathode) | source_port_149 | VM |
| D_VM_TVS.pin2 (anode) | source_port_150 | GND |

The source records keep VM and GND separate. The PCB trace declares VM
ownership but ends on the TVS GND pad. A physical connection must not change
that source intent.

All coordinates are board-space points in millimetres: +X right, +Y up.
The standard PCB renderer draws the fixture and its pad labels. Tests add
a note stating the asserted software result. The complete, unchanged board
capture remains a separate regression fixture.
