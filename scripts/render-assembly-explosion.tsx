import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Circuit, getAssemblyExplosion } from "lib"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { renderGLTFToPNGFromGLB } from "poppygl"
import { ExplosionLamp } from "tests/assembly/fixtures/explosion-lamp"
import { poppyglExplosionLines } from "tests/assembly/fixtures/poppygl-explosion-lines"

// Run: bun scripts/render-assembly-explosion.tsx [output-directory]
const outputDirectory = process.argv[2] ?? "work/assembly-explosion-preview"
mkdirSync(outputDirectory, { recursive: true })
const circuit = new Circuit()
circuit.add(<ExplosionLamp />)
await circuit.renderUntilSettled()
const views = [
  {
    name: "assembled",
    options: { throughStageRef: "LAMP.lift-cover", stageProgress: 0 },
  },
  { name: "lifted", options: { throughStageRef: "LAMP.lift-cover" } },
  { name: "parked", options: { throughStageRef: "LAMP.park-cover" } },
  { name: "exploded", options: {} },
]
for (const { name, options } of views) {
  const view = getAssemblyExplosion(circuit, options)
  const glb = (await convertCircuitJsonToGltf(view.circuitJson, {
    includeModels: true,
    format: "glb",
    showBoundingBoxes: false,
  })) as ArrayBuffer
  const png = await renderGLTFToPNGFromGLB(new Uint8Array(glb), {
    width: 1200,
    height: 900,
    supersampling: 2,
    fov: 40,
    camPos: [240, 180, 250],
    lookAt: [-40, 100, 0],
    backgroundColor: [1, 1, 1],
    grid: false,
    explosionLines: poppyglExplosionLines(view),
  })
  writeFileSync(join(outputDirectory, `${name}.glb`), new Uint8Array(glb))
  writeFileSync(join(outputDirectory, `${name}.png`), png)
  writeFileSync(
    join(outputDirectory, `${name}.json`),
    JSON.stringify(view, null, 2),
  )
}
console.log(
  `Rendered ${views.length} constrained explosion states into ${outputDirectory}`,
)
