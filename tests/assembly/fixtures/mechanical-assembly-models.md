The CSS face-mounting snapshots use recognizable workshop parts rather than
featureless solids. `mechanical-assembly-models.tsx` authors nominal T-slot
extrusions, a linear carriage, spindle and split clamp, slotted plates, an angle
bracket, and a vented enclosure in JSCAD. These are illustrative mechanical
fixtures, not manufacturing drawings. Dimensions and holes remain visible in
the source. Placement between parts uses reference faces and relative offsets.

The motors, socket-head screws, SOIC8 driver, and pin headers are actual
**JSCAD Electronics** models.
`with-local-nema-mesh.ts` preserves the emitted placements and replaces network
assets with pinned local meshes (see also `nema-wire-meshes.md`). The additional
assets here were generated with **jscad-electronics 0.0.243**,
**jscad-to-gltf 0.0.9**, and **@jscad/modeling 2.13.0**:

```ts
import { getJscadModelForFootprint } from "jscad-electronics/vanilla"
import modeling from "@jscad/modeling"
import { convertJscadModelToGltf } from "jscad-to-gltf"

for (const [spec, filename] of [
  ["hexsocketbolt_m3_l10mm_nothreads", "m3-socket-head.glb.gz"],
  ["nema17_bodylength40mm_plainbackface", "nema17-body40.glb.gz"],
  ["soic8", "soic8-driver.glb.gz"],
  ["pinrow8", "pinrow8-header.glb.gz"],
  ["hexbolt_m3_l10mm_nothreads", "hexbolt-m3.glb.gz"],
  ["panscrew_m3_l10mm_nothreads", "panscrew-m3.glb.gz"],
  ["flatheadscrew_m3_l10mm_nothreads", "flatheadscrew-m3.glb.gz"],
]) {
  const model = getJscadModelForFootprint(spec, modeling)
  const { data } = await convertJscadModelToGltf(model, {
    format: "glb", axisTransform: "none", meshName: spec,
  })
  await Bun.write(filename, Bun.gzipSync(new Uint8Array(data as ArrayBuffer)))
}
```

All assets retain right-handed **part-local XYZ, in millimeters**. Motor +Z
points toward the shaft; its front face is Z=0. The M3 screw's head underside is
Z=0, the shaft extends to Z=-10 and the head to Z=3. The controller fixture uses
a flush rear cap so its 2 mm gap clears the motor
without rear screw heads intersecting the PCB. Threads are omitted to keep
software-rendered snapshots fast; the hex socket remains modeled.

The `model_focus` snapshot layout reserves a large view for the actual exported
GLB and pairs it with the relevant constraints, part colors, and dimensions.
Additional cameras expose occluded mounting features. Camera coordinates are in
renderer scene space (-circuit X, +circuit Z, +circuit Y); the tests assert
placements in circuit world space (+X right, +Y top, +Z above, mm).

The bolt tests use `with-local-bolt-mesh.ts` to pin all four head types after
asserting their emitted canonical URLs. The PCB fixture uses actual plain and
plated holes, including the virtual `.top` and `.bottom` seating surfaces. A
bare hole selector chooses its top surface. Mechanical holes and slots use
explicit named reference surfaces at their physical seating locations; the
solver does not infer a hole datum from arbitrary imported meshes. The implicit
bolt mating face is `base`, at its authored origin with outward normal -Z;
a custom `mountFace` can override it. Standard socket/hex/pan origins are under
the head, while countersunk model origins are at the top of the head.
