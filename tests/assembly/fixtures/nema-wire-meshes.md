These GLBs were generated with the wire-reference implementation in tscircuit/jscad-electronics PR #401 and the spec from tscircuit/modelprinter PR #10. They keep mesh assertions independent of modelcdn deployments.

From a built jscad-electronics checkout, run:

```ts
import { getJscadModelForFootprint } from "./dist/vanilla.js"
import jscad from "@jscad/modeling"
import { convertJscadModelToGltf } from "jscad-to-gltf"
for (const angle of [0, 90]) {
  const model = getJscadModelForFootprint(`nema17_wireangle${angle}deg`, jscad)
  const glb = await convertJscadModelToGltf(model, { format: "glb" })
  await Bun.write(`nema17-wireangle${angle}.glb`, glb.data as ArrayBuffer)
}
```

Use no axis transform, matching modelcdn's `convertFootprinterModel`. The GLB retains motor-local millimeters: +Z toward the shaft, front face at the origin, rear face at -38 mm, shaft tip at +24 mm, default wire exit at +X. The body is 42.3 mm wide and the wire stubs extend another 6 mm from the rear cap.
