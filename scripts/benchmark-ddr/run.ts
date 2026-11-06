import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const benchmarkRoot = dirname(fileURLToPath(import.meta.resolve("@tscircuit/core-ddr-benchmark/package.json")))
const child = Bun.spawn([
  process.execPath,
  resolve(benchmarkRoot,"scripts/run.ts"),
  "--core", process.cwd(),
  "--out", resolve("ddr-benchmark-results"),
  ...process.argv.slice(2),
], { stdin:"inherit", stdout:"inherit", stderr:"inherit" })
process.exitCode = await child.exited
