import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { resolve, join } from "node:path"

const [coreDirectory, outputDirectory, mode] = process.argv.slice(2)
if (
  !coreDirectory ||
  !outputDirectory ||
  (mode !== "baseline" && mode !== "consumer")
)
  throw new Error(
    "Usage: bun scripts/diagnostics/run-native-h3-routing-access.ts <Core checkout> <new output directory> <baseline|consumer>",
  )
const corePath = resolve(coreDirectory)
const outputPath = resolve(outputDirectory)
if (existsSync(outputPath))
  throw new Error("Choose a new output directory for this native H3 run")
mkdirSync(outputPath, { recursive: true })
const log = openSync(join(outputPath, "worker.log"), "w")
const started = performance.now()
const child = Bun.spawn(
  [
    process.execPath,
    "--tsconfig-override",
    join(corePath, "tsconfig.json"),
    resolve(import.meta.dir, "native-h3-routing-access.tsx"),
    corePath,
    outputPath,
    mode,
  ],
  { cwd: corePath, stdout: log, stderr: log },
)
let renderTimedOut = false
let assessmentTimedOut = false
let renderWallMs: number | undefined
let peakRssMb: number | null = null
let assessmentTimer: ReturnType<typeof setTimeout> | undefined
const renderMarker = join(outputPath, "routing-run.json")
const observeRenderEnd = () => {
  if (renderWallMs !== undefined || !existsSync(renderMarker)) return
  // The worker writes an exact end-of-render high-water sample before any
  // assessment. Keep this final sample as well as the supervisor's polling.
  let renderEnd: { renderPeakRssMb: number | null }
  try {
    renderEnd = JSON.parse(readFileSync(renderMarker, "utf8"))
  } catch {
    // A concurrent write may have created the marker but not finished yet.
    return
  }
  if (renderEnd.renderPeakRssMb !== null)
    peakRssMb = Math.max(peakRssMb ?? 0, renderEnd.renderPeakRssMb)
  renderWallMs = performance.now() - started
  clearTimeout(renderTimer)
  assessmentTimer = setTimeout(() => {
    assessmentTimedOut = true
    child.kill("SIGKILL")
  }, 120_000)
}
// Match the pinned DDR benchmark's Linux VmHWM sampling method. This measures
// the diagnostic worker, including its observations; official paired DDR and
// AM3352 runs remain the source of product runtime/memory regression costs.
const sampling = setInterval(() => {
  observeRenderEnd()
  if (renderWallMs !== undefined || process.platform !== "linux") return
  try {
    const status = readFileSync(`/proc/${child.pid}/status`, "utf8")
    const highWater = status.match(/VmHWM:\s+(\d+)/)
    if (highWater)
      peakRssMb = Math.max(peakRssMb ?? 0, Number(highWater[1]) / 1024)
  } catch {
    /* The worker can exit between sampling ticks. */
  }
}, 50)
const renderTimer = setTimeout(() => {
  observeRenderEnd()
  if (renderWallMs !== undefined) return
  renderTimedOut = true
  child.kill("SIGKILL")
}, 300_000)
const exitCode = await child.exited
observeRenderEnd()
clearTimeout(renderTimer)
if (assessmentTimer) clearTimeout(assessmentTimer)
clearInterval(sampling)
closeSync(log)
const totalWallMs = performance.now() - started
const renderBudgetExceeded =
  renderTimedOut || (renderWallMs ?? totalWallMs) > 300_000
const workerCompletedWithinBudgets =
  exitCode === 0 && !renderBudgetExceeded && !assessmentTimedOut
const resource = {
  schemaVersion: 1,
  corePath,
  mode,
  exitCode,
  renderTimedOut,
  assessmentTimedOut,
  renderBudgetExceeded,
  workerCompletedWithinBudgets,
  renderBudgetMs: 300_000,
  assessmentBudgetMs: 120_000,
  renderWallMs: renderWallMs ?? totalWallMs,
  totalWallMs,
  peakRssMb,
  memoryMethod:
    process.platform === "linux"
      ? "proc_vm_hwm_50ms"
      : "unavailable_on_this_platform",
  measurementScope: "diagnostic_worker_import_and_render_with_observations",
}
writeFileSync(
  join(outputPath, "resources.json"),
  JSON.stringify(resource, null, 2),
)
console.log(JSON.stringify(resource))
if (!workerCompletedWithinBudgets) process.exitCode = 1
