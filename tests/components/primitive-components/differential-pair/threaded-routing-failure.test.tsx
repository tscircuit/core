import { expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"

// The installed Bun is older than the worker runtime's Bun minimum. Exercise
// the real threaded Node runtime with the same TSX-authored routing problem.
test("threaded asynchronous routing preserves a plain measured skew failure", async () => {
  const outputDir = await mkdtemp(join(import.meta.dir, ".threaded-pair-"))
  try {
    const build = await Bun.build({
      entrypoints: [
        join(
          import.meta.dir,
          "../../../fixtures/run-differential-pair-threaded-node.tsx",
        ),
      ],
      target: "node",
      outdir: outputDir,
      naming: "[name].mjs",
    })
    expect(build.success).toBe(true)
    const child = Bun.spawn(
      ["node", join(outputDir, "run-differential-pair-threaded-node.mjs")],
      { stdout: "pipe", stderr: "pipe" },
    )
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    expect(exitCode, stderr).toBe(0)
    const failure = JSON.parse(stdout.split("PAIR_RESULT ")[1]!)
    expect(failure.reason).toBe("length_skew")
    expect(failure.pairIndex).toBe(0)
    expect(failure.laneLengthsMm[0]).toBeCloseTo(21.2)
    expect(failure.laneLengthsMm[1]).toBeCloseTo(20)
  } finally {
    await rm(outputDir, { recursive: true, force: true })
  }
}, 30_000)
