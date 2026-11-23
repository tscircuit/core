# NEMA8 conflicting autorouter endpoints

This is the complete Circuit JSON emitted by
`@tsci/ShiboSoftwareDev.nema8-20mm-dual-usbc-stepper-controller@1.0.48`.

The saved VM route ending in `mst7_0` retains `pcb_port_150` from an older
render. In this capture that identifier belongs to the grounded anode of
`D_VM_TVS`, while the other endpoint belongs to VM.

`visual-repro.svg` isolates the two TVS copper pads, C_VM_HF1.pin1 and this
route using their original positions and widths. Dashed top copper overlays
solid bottom copper in the same board coordinate frame. Its snapshot shows
the route acceptance or rejection asserted by the test beside the unchanged
copper; the test still uses the entire circuit capture.
