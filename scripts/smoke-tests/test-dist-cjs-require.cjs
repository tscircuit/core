// Registry components published as CJS call require("@tscircuit/core").
// Reproduce that from a fake package whose node_modules points at this repo.
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const coreRoot = path.resolve(__dirname, "../..")
const distEntry = path.join(coreRoot, "dist", "index.js")

if (!fs.existsSync(distEntry)) {
  console.error(`Missing ${distEntry}. Run bun run build first.`)
  process.exit(1)
}

const fake = fs.mkdtempSync(path.join(os.tmpdir(), "core-cjs-require-"))
const coreLink = path.join(fake, "node_modules", "@tscircuit", "core")
fs.mkdirSync(path.dirname(coreLink), { recursive: true })
fs.symlinkSync(coreRoot, coreLink)
fs.writeFileSync(
  path.join(fake, "index.cjs"),
  `
    const core = require("@tscircuit/core")
    const Circuit = core.RootCircuit || core.Circuit
    if (typeof Circuit !== "function") {
      console.error("RootCircuit missing after CJS require", Object.keys(core).slice(0, 30))
      process.exit(1)
    }
    console.log("CJS require(@tscircuit/core) loaded RootCircuit")
  `,
)

const runtimes = ["bun"]
if (spawnSync("node", ["-v"], { encoding: "utf8" }).status === 0) {
  runtimes.push("node")
}

let failed = false
for (const runtime of runtimes) {
  const result = spawnSync(runtime, ["index.cjs"], {
    cwd: fake,
    encoding: "utf8",
  })
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim()
  if (result.status !== 0) {
    failed = true
    console.error(`${runtime} require("@tscircuit/core") failed:\n${output}`)
    continue
  }
  console.log(`${runtime}: ${output}`)
}

fs.rmSync(fake, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
