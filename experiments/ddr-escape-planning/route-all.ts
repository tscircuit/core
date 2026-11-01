import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { BusLanesPipelineSolver } from "./vendor/solver/lib/index.ts"
const input = JSON.parse(
  readFileSync(
    process.env.PROOF_INPUT ?? `${import.meta.dir}/fixture/input.json`,
    "utf8",
  ),
)
const root = process.env.PROOF_ROOT ?? `${import.meta.dir}/results/all`
mkdirSync(root, { recursive: true })
const solver = new BusLanesPipelineSolver(input, {
  maxSearchIterations: 2_000_000,
  maxLaneIterations: 1_000_000,
})
const start = performance.now()
let last = start
while (!solver.solved && !solver.failed) {
  solver.step()
  if (performance.now() - last > 5000) {
    console.log(
      JSON.stringify({
        seconds: (performance.now() - start) / 1000,
        phase: solver.phase,
        iterations: solver.iterations,
      }),
    )
    last = performance.now()
  }
}
writeFileSync(
  `${root}/report.json`,
  JSON.stringify(
    {
      solved: solver.solved,
      failed: solver.failed,
      error: solver.error,
      phase: solver.phase,
      seconds: (performance.now() - start) / 1000,
      stats: solver.stats,
    },
    null,
    2,
  ),
)
if (solver.solved)
  writeFileSync(
    `${root}/candidate.json`,
    JSON.stringify({ traces: solver.traces }),
  )
process.exit(solver.solved ? 0 : 1)
