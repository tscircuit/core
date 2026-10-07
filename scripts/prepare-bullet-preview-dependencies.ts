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
    "@tscircuit/props": "https://pkg.pr.new/@tscircuit/props@30c249f",
    "circuit-json": "https://pkg.pr.new/circuit-json@15e3079",
    "@tscircuit/cableprinter":
      "^0.0.6",
    "circuit-json-to-gltf":
      "^0.0.148",
  }
  for (const [name, preview] of Object.entries(previews)) {
    manifest.devDependencies[name] = preview
    manifest.overrides[name] = preview
    console.log(`Using ${name} from ${preview}`)
  }
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
}
