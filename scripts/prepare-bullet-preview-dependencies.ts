import { readFileSync, writeFileSync } from "node:fs"

// Exercise the coordinated cable PRs before npm releases exist. Only CI/preview
// installations are changed; the checked-in publish manifest retains release specs.
// Pin the feature revisions even if other PRs publish the same anticipated versions.
if (
  process.env.GITHUB_EVENT_NAME === "pull_request" ||
  process.env.VERCEL_ENV === "preview"
) {
  const packagePath = new URL("../package.json", import.meta.url)
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"))
  const previews = {
    "@tscircuit/props": "https://pkg.pr.new/@tscircuit/props@813a9f6",
    "circuit-json": "https://pkg.pr.new/circuit-json@4dcebf2",
    "@tscircuit/cableprinter":
      "https://pkg.pr.new/tscircuit/cableprinter/@tscircuit/cableprinter@5a4a697",
    "circuit-json-to-gltf":
      "https://pkg.pr.new/tscircuit/circuit-json-to-gltf@5cb3041",
  }
  for (const [name, preview] of Object.entries(previews)) {
    manifest.devDependencies[name] = preview
    manifest.overrides[name] = preview
    console.log(`Testing ${name} with its immutable cable PR preview`)
  }
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
}
