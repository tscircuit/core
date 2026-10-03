These pinned JSCAD meshes keep assembly geometry tests independent of modelcdn deployments. The original NEMA17 meshes come from jscad-electronics PR #401 and modelprinter PR #10. The compressed NEMA8, NEMA23 and custom NEMA17 meshes use the corresponding published jscad-electronics 0.0.184 and modelprinter 0.0.6.

From a built jscad-electronics checkout, generate the fixtures with:

```ts
import { getJscadModelForFootprint } from "./dist/vanilla.js"
import jscad from "@jscad/modeling"
import { convertJscadModelToGltf } from "jscad-to-gltf"

for (const [spec, filename] of [
  ["nema17", "nema17-wireangle0.glb"],
  ["nema17_wireangle90deg", "nema17-wireangle90.glb"],
  ["nema8", "nema8.glb.gz"],
  ["nema23", "nema23.glb.gz"],
  ["nema17_bodylength48mm_shaftlength30mm_flatdepth0.5mm_flatlength18mm_plainbackface", "nema17-custom-plain-backface.glb.gz"],
]) {
  const model = getJscadModelForFootprint(spec, jscad)
  const { data } = await convertJscadModelToGltf(model, {
    format: "glb", axisTransform: "none", meshName: spec,
  })
  const bytes = new Uint8Array(data as ArrayBuffer)
  await Bun.write(filename, filename.endsWith(".gz") ? Bun.gzipSync(bytes) : bytes)
}
```

Meshes retain motor-local millimeters: right-handed +Z toward the shaft, front face at the origin, rear face at minus the body length, default wire exit at +X. Wire stubs extend 6 mm from the rear cap. Standard rear screw heads project another 2 mm (NEMA8), 3 mm (NEMA17) or 4 mm (NEMA23) beyond the rear face; these are included in overall mesh bounds. The custom flush fixture explicitly uses `_plainbackface` to omit protruding fasteners.

The fixture loader replaces only motor assets, preserving emitted CAD placement and all PCB geometry. Core performs no mesh generation.
