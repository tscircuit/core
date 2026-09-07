# Allwinner T113-S3 USB UART fanout regression

`usb-uart.srj.json` freezes the USB UART area of the
[Allwinner T113-S3 development board](https://tscircuit.com/seveibar/allwinner-t113-dev-board).
It contains 36 pad obstacles and 11 power/ground connections terminating at
`inner1` (GND) or `inner2` (V3V3). Geometry uses board-world millimeters: +X is
right, +Y is up, +Z is above (right-handed), and the copper stack is
top / inner1 / inner2 / bottom.

This is a reduced routing fixture, not a replacement design or fabrication
artifact. Original pad coordinates, dimensions, layers, IDs, and routing rules
are preserved. It was extracted from the captured `base-plane-srj.json` with
SHA-256 `447174f009434e9c5bb026bf53ed8a053fccd8b307328c5a092bba1c3f481bdb`
(331 connections, 699 obstacles, 193 plane buses):

1. Keep singleton connections whose source point is inside
   `-52 < x < -38`, `25 < y < 40`, and their plane buses.
2. Keep pad obstacles whose rectangles intersect that region.
3. Keep each obstacle's selected connection IDs, `connectivity_net*` IDs, own
   SMT pad ID, and own PCB port ID in `connectedTo`. Remove unrelated aliases.
4. Remove the remote board outline and crop bounds to
   `minX=-53, maxX=-37, minY=24, maxY=41`.

With fanout-solver 0.0.66, identical captured constructor arguments route 10/11
connections when `allowSameNetMerges` is false and 11/11 when it is true. The
full saved input similarly completes 191/193 plane connections without merging
and 193/193 with merging under otherwise identical current wrapper options. The
core regression compares complete trace output to a direct replay, verifies the
plane handoff and physical through-via stack, and keeps the no-merge control.
The JSX regression reconstructs these pads through the public core API so phase
conversion and filtering are also exercised. A separate mixed signal/plane
regression ensures this default does not enable merging for boundary buses.

The original whole-board 32/193 timeout did not save its effective routing input
and resolved options. This fixture reproduces a specific same-net merging gap;
it does not claim to explain that earlier timeout.
