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
Waypoint coordinates come from the assembly's neutral wiring manifest and route
around the cradle and carriers. The motor pigtail references describe **proposed
detachable PH3 terminations** outside each motor; the Robu 2805 is not claimed to
include a JST connector. These surfaces are mating centers. Cableprinter adds
the PH housing and its 6.85 mm wire-exit depth along the surface normal.

The screenshot is a routing demonstration, not manufacturing approval or a flex
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

## Clearance audit of the new native cable paths

The optional [FreeCAD audit](./audit-gimbal-one-waypoints.py) checks the newly
emitted `cad_cable.path` from this fixture, rather than the old custom wire meshes.
Run it using FreeCAD's Python, passing the original `gimbal-one-2805.FCStd` and
the newly rendered Circuit JSON:

```sh
python audit-gimbal-one-waypoints.py gimbal-one-2805.FCStd routed.circuit.json
```

The source CAD is included in the published gimbal's mechanical source download.
The [recorded audit](./gimbal-one-waypoints-clearance.json) pins both input hashes.
It checks all 221 original rigid BReps against conservative 2.6 mm-radius capsules
around the new straight wire segments, plus the six PH3 housing bounding boxes.
The proposed roll and yaw pigtail mating planes are at X=-30 and X=30 mm,
respectively, to clear the existing motor mounting screws.

Results: no wire/part, housing/part or bundle/bundle interferences in this pose.
Minimum capsule/part clearance is 0.4104 mm near the upper jaw and board exits;
minimum clearance between the conservative wire-bundle capsules is 7.2379 mm.
These are nominal static CAD clearances, with no print tolerances or motion added.
