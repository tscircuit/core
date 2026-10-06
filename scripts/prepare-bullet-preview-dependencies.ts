import { readFileSync, writeFileSync } from "node:fs"

// Exercise the coordinated bullet PRs before npm releases exist. Only CI/preview
// installations are changed; the checked-in publish manifest retains release specs.
if (
  process.env.GITHUB_EVENT_NAME === "pull_request" ||
  process.env.VERCEL_ENV === "preview"
) {
  const packagePath = new URL("../package.json", import.meta.url)
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"))
  const previews = {
    "@tscircuit/props": "https://pkg.pr.new/@tscircuit/props@f165269",
    "circuit-json": "https://pkg.pr.new/circuit-json@a2aa046",
    "@tscircuit/cableprinter":
      "https://pkg.pr.new/tscircuit/cableprinter/@tscircuit/cableprinter@5e55404",
    "circuit-json-to-gltf":
      "https://pkg.pr.new/tscircuit/circuit-json-to-gltf@6f2f234",
  }
  for (const [name, preview] of Object.entries(previews)) {
    const release = manifest.devDependencies[name].replace(/^\^/, "")
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(name)}/${release}`,
    )
    if (response.ok) continue
    if (response.status !== 404)
      throw new Error(
        `Cannot check ${name}@${release}: HTTP ${response.status}`,
      )
    manifest.devDependencies[name] = preview
    manifest.overrides[name] = preview
    console.log(`Testing ${name} with its immutable bullet PR preview`)
  }
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
}
