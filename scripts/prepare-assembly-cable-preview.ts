import { readFileSync, writeFileSync } from "node:fs"

if (
  process.env.GITHUB_EVENT_NAME === "pull_request" ||
  process.env.VERCEL_ENV === "preview"
) {
  const packagePath = new URL("../package.json", import.meta.url)
  const manifest = JSON.parse(readFileSync(packagePath, "utf8"))
  const preview = "https://pkg.pr.new/@tscircuit/props@1c96d90"
  manifest.devDependencies["@tscircuit/props"] = preview
  manifest.overrides["@tscircuit/props"] = preview
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
}
