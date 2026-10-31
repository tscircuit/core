import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { superviseRouting } from "./supervise"

test("a rejected later candidate cannot replace accepted copper, and corrupted copper cannot resume", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ddr-preservation-"))
  const command = (script: string) => [process.execPath, "-e", script]
  try {
    const stages = [
      {
        name: "first",
        attempts: [
          {
            name: "route",
            timeoutMs: 1000,
            command: command(
              'await Bun.write(process.env.ROUTING_OUTPUT_PATH, JSON.stringify({ traces: ["accepted"] }))',
            ),
          },
        ],
        validationCommand: command(
          'const c=await Bun.file(process.env.ROUTING_OUTPUT_PATH).json();process.exit(c.traces[0]==="accepted"?0:1)',
        ),
      },
      {
        name: "second",
        attempts: [
          {
            name: "bad_candidate",
            timeoutMs: 1000,
            command: command(
              'await Bun.write(process.env.ROUTING_OUTPUT_PATH, JSON.stringify({ traces: ["invalid"] }))',
            ),
          },
        ],
        validationCommand: command("process.exit(1)"),
      },
    ]
    const options = {
      input: { board: "preservation_test" },
      stages,
      checkpointDirectory: directory,
      totalTimeoutMs: 5000,
      validationTimeoutMs: 1000,
      configurationId: "test_only_no_geometry",
    }
    const result = await superviseRouting(options)
    expect(result.status).toBe("incomplete")
    expect(result.acceptedStages).toEqual(["first"])
    expect(JSON.parse(await readFile(result.artifactPath, "utf8"))).toEqual({
      traces: ["accepted"],
    })
    expect(result.attempts.at(-1)?.status).toBe("validation_failed")
    const resumed = await superviseRouting(options)
    expect(resumed.attempts.map((a) => a.stage)).toEqual(["second"])
    await writeFile(
      result.artifactPath,
      JSON.stringify({ traces: ["corrupted"] }),
    )
    await expect(superviseRouting(options)).rejects.toThrow(
      "Checkpoint copper was modified",
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
