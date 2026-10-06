import { readFileSync, writeFileSync } from "node:fs"

// Exercise the coordinated bullet PRs before npm releases exist. Only CI/preview
// installations are changed; the checked-in publish manifest retains release specs.
// Pin the feature revisions even if other PRs publish the same anticipated versions.
if (
  process.env.GITHUB_EVENT_NAME === "pull_request" ||
  process.env.VERCEL_ENV === "preview"
) {
  const packagePath = new URL("../package.json", import.meta.url)
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"))
  const previews = {
    "@tscircuit/props": "https://pkg.pr.new/@tscircuit/props@bc671a1",
    "circuit-json": "https://pkg.pr.new/circuit-json@a2aa046",
    "@tscircuit/cableprinter":
      "https://pkg.pr.new/tscircuit/cableprinter/@tscircuit/cableprinter@e7b28af",
    "circuit-json-to-gltf":
      "https://pkg.pr.new/tscircuit/circuit-json-to-gltf@3f7eb88",
  }
  for (const [name, preview] of Object.entries(previews)) {
    manifest.devDependencies[name] = preview
    manifest.overrides[name] = preview
    console.log(`Testing ${name} with its immutable bullet PR preview`)
  }
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
}
