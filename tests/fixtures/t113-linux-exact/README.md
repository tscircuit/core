# Exact T113-S3 Linux board fixture

This is the 96-component TSX circuit used to reproduce the routing failures
found while building the Allwinner T113-S3 Linux board. The board uses the
default Pipeline9 autorouter, four copper layers, and no manual routes, vias,
breakout points, or route hints.

The fixture is intentionally kept as TSX and supplier Circuit JSON so Core
tests exercise the same component tree, placement, fanout groups, and routing
configuration as the original board.

`winding-breakout-input.json` is the unmodified input emitted by the board for
the BUCK-to-SUP33 connections on current `main`. The test replaces only its
region bounds with the bounds produced by the live TSX render, keeping the
real endpoints and 0.85 mm boundary-point spacing.
