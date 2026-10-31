import { mkdir, writeFile } from "node:fs/promises"
import { superviseRouting } from "./supervise"
const root = import.meta.dir
const input = await Bun.file(`${root}/fixture/input.json`).json()
const scenario = process.argv[2] ?? "incremental"
const directory = `${root}/results/${scenario}`
await mkdir(directory, { recursive: true })
const command = (script: string, env: Record<string, string>) => [
  "env",
  ...Object.entries(env).map(([k, v]) => `${k}=${v}`),
  process.execPath,
  `${root}/${script}`,
]
const stages = [0, 1, 2].map((group) => ({
  name: `ddr_group_${group}`,
  attempts: [
    ...(scenario === "deadline_recovery" && group === 0
      ? [
          {
            name: "short_budget",
            timeoutMs: 1000,
            command: command("route-group.ts", {
              GROUP: String(group),
              PROOF_ROOT: directory,
              SUFFIX: "short",
              SECONDS: "120",
            }),
          },
        ]
      : []),
    {
      name: "default",
      timeoutMs: 120000,
      command: command("route-group.ts", {
        GROUP: String(group),
        PROOF_ROOT: directory,
        SUFFIX: "default",
        SECONDS: "120",
      }),
    },
    ...(group > 0
      ? [
          {
            name: "fine_grid",
            timeoutMs: 120000,
            command: command("route-group.ts", {
              GROUP: String(group),
              PROOF_ROOT: directory,
              SUFFIX: "fine",
              SECONDS: "120",
              GRID_STEP: ".05",
            }),
          },
        ]
      : []),
  ],
  validationCommand: command("validate-prefix.ts", {
    EXPECTED_GROUPS: Array.from({ length: group + 1 }, (_, i) => i).join(","),
  }),
}))
const result = await superviseRouting({
  input,
  stages,
  checkpointDirectory: `${directory}/checkpoint`,
  totalTimeoutMs: 360000,
  validationTimeoutMs: 30000,
  configurationId: "am3352-layout-b-common-solver-v1",
  onProgress: (e) => console.log(JSON.stringify(e)),
})
await writeFile(
  `${directory}/result.json`,
  JSON.stringify({ ...result, wholeBoardComplete: false }, null, 2),
)
console.log(JSON.stringify(result))
