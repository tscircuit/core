import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { superviseRouting } from "./supervise"

test("a non-cooperative routing process is killed, a fallback validates, and checkpoints reject a different board", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ddr-supervisor-"))
  try {
    const stages = [
      {
        name: "byte_lane",
        attempts: [
          {
            name: "stalled",
            command: [process.execPath, "-e", "while(true){}"],
            timeoutMs: 100,
          },
          {
            name: "fallback",
            command: [
              process.execPath,
              "-e",
              "await Bun.write(process.env.ROUTING_OUTPUT_PATH, JSON.stringify({traces:[]}))",
            ],
            timeoutMs: 1000,
          },
        ],
        validationCommand: [process.execPath, "-e", "process.exit(0)"],
      },
    ]
    const options = {
      input: { layout: "different_layout_b" },
      stages,
      checkpointDirectory: directory,
      totalTimeoutMs: 5000,
      validationTimeoutMs: 1000,
      configurationId: "test_only_no_geometry",
    }
    const result = await superviseRouting(options)
    expect(result.status).toBe("validated")
    expect(result.attempts.map((a) => a.status)).toEqual([
      "timed_out",
      "validated",
    ])
    expect(result.milliseconds).toBeLessThan(3000)
    expect(
      JSON.parse(await readFile(join(directory, "checkpoint.json"), "utf8"))
        .acceptedStages,
    ).toEqual(["byte_lane"])
    const resumed = await superviseRouting(options)
    expect(resumed.attempts).toEqual([])
    await expect(
      superviseRouting({ ...options, input: { layout: "another_board" } }),
    ).rejects.toThrow("different board")
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
