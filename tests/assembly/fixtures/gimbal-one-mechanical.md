# Gimbal One cable-waypoint fixture

The mesh archive is a lossless extract of the actual Gimbal One black, screw-clamped
phone gimbal, not a replacement enclosure or a NEMA motor mock-up. It contains all
221 rigid-part OBJ meshes from `mohan-bee/gimbal-one-pcb` revision `0.1.10`:

https://tscircuit.com/mohan-bee/gimbal-one-pcb?version=0.1.10#3d

That includes the 19 printed parts, all three 2805 stator bodies and rotor bells,
motor adapters, screws, washers, phone reference, handle and folding stand.
The original FreeCAD tessellations are unchanged. Their vertices are already in
right-handed circuit-world millimeters: +X right, +Y top, +Z above. Each imported
part therefore stays at the origin with no additional rotation or scale.

For a smaller, focused test, the one 84 × 70 × 1.6 mm controller board retains
only its three actual JST PH3 motor headers at (-26, 29), (0, 29), (26, 29), plus
the four Ø2.7 mm mounting holes at (±38, ±31). Electronics and copper routing are
omitted; no extra board or hidden cable endpoints are introduced.

The three motor harnesses use `assembly.cable`, not precomputed wire meshes.
The assembly's neutral wiring manifest supplies the expected world-space route.
The fixture converts those points into start-relative offsets and uses the
controller board's axes with `waypointAnchor="start"` and
`waypointAxisOrientation="board_at_start"`. The motor pigtail references describe **proposed
detachable PH3 terminations** outside each motor; the Robu 2805 is not claimed to
include a JST connector. These surfaces are mating centers. Cableprinter adds
the PH housing and its 6.85 mm wire-exit depth along the surface normal.

This fixture is a routing demonstration, not manufacturing approval or a flex
simulation. Actual motor lead exits, minimum bend radii and moving-axis slack
still require physical testing.

## Reproducible asset extraction

Original source: `outputs/gimbal-one-pcb/mechanical-cad.json` in the Gimbal One
project. Keep only `name`, `printable`, `objUrl` from each record, JSON-encode with
separators `(',', ':')`, encode as UTF-8 and gzip with `mtime=0`.

- Source SHA-256: `229de6693467ddd781f9d69362ea593ae23c6966b850a129b26c481276c33f50`
- Uncompressed extract SHA-256: `ca44105f4ac66945b15396348562f671d51239027127179139286ddb35c6b269`
- `gimbal-one-mechanical.json.gz` SHA-256: `367e033b735c78e83bbbe067a5e2b103b0fd0d68006293189ae82586ad201744`

The archive is 556,784 bytes; no network requests are needed for mechanical assets.

The test checks the emitted cable paths against the phone's clearance envelope,
including a 2.6 mm allowance for the wire bundle. It also confirms the automatic
route crosses that envelope, so the fixture demonstrates the need for waypoints.
