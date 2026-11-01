/** Experimental Bun supervisor; not imported by the production/browser build.
 * Workers read ROUTING_FIXED_PATH (the accepted prefix) and write the complete
 * new prefix to ROUTING_OUTPUT_PATH. Validation must check that prefix against
 * the original board, including connectivity, unchanged fixed copper and timing.
 * Workers must not spawn descendants: this adapter kills the direct process.
 */
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises"
import { join } from "node:path"
export interface RoutingStage {
  name: string
  attempts: { name: string; command: string[]; timeoutMs: number }[]
  validationCommand: string[]
}
const hash = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex")
export async function superviseRouting(options: {
  input: unknown
  stages: RoutingStage[]
  checkpointDirectory: string
  totalTimeoutMs: number
  validationTimeoutMs: number
  configurationId: string
  onProgress?: (event: {
    stage: string
    attempt: string
    status: string
  }) => void
}) {
  if (
    ![
      options.totalTimeoutMs,
      options.validationTimeoutMs,
      ...options.stages.flatMap((s) => s.attempts.map((a) => a.timeoutMs)),
    ].every((n) => Number.isFinite(n) && n > 0)
  )
    throw new Error("Invalid routing deadline")
  if (new Set(options.stages.map((s) => s.name)).size !== options.stages.length)
    throw new Error("Routing stage names must be unique")
  const started = performance.now()
  const inputHash = hash(JSON.stringify(options.input))
  const configurationHash = hash(
    JSON.stringify({
      id: options.configurationId,
      stages: options.stages,
      validationTimeoutMs: options.validationTimeoutMs,
    }),
  )
  await mkdir(options.checkpointDirectory, { recursive: true })
  const runDirectory = await mkdtemp(join(options.checkpointDirectory, "run-"))
  const checkpointPath = join(options.checkpointDirectory, "checkpoint.json")
  let acceptedStages: string[] = []
  let artifactHash: string | undefined
  let fixedPath = ""
  let savedText: string | undefined
  try {
    savedText = await readFile(checkpointPath, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  if (savedText) {
    const saved = JSON.parse(savedText)
    if (
      saved.version !== 2 ||
      saved.inputHash !== inputHash ||
      saved.configurationHash !== configurationHash
    )
      throw new Error(
        "Checkpoint belongs to a different board or routing configuration",
      )
    if (
      !Array.isArray(saved.acceptedStages) ||
      !saved.acceptedStages.length ||
      saved.acceptedStages.some(
        (s: string, i: number) => s !== options.stages[i]?.name,
      ) ||
      !/^[a-f0-9]{64}$/.test(saved.artifactHash)
    )
      throw new Error("Invalid routing checkpoint")
    acceptedStages = saved.acceptedStages
    artifactHash = saved.artifactHash
    fixedPath = join(options.checkpointDirectory, `${artifactHash}.json`)
    if (hash(await readFile(fixedPath)) !== artifactHash)
      throw new Error("Checkpoint copper was modified")
  }
  const attempts: {
    stage: string
    attempt: string
    status: string
    milliseconds: number
  }[] = []
  const run = async (
    command: string[],
    budget: number,
    label: string,
    outputPath: string,
  ) => {
    const remaining = options.totalTimeoutMs - (performance.now() - started)
    if (remaining <= 0) return { status: "deadline", milliseconds: 0 }
    const start = performance.now()
    const child = Bun.spawn(command, {
      stdout: Bun.file(join(runDirectory, `${label}.stdout.log`)),
      stderr: Bun.file(join(runDirectory, `${label}.stderr.log`)),
      env: {
        ...process.env,
        ROUTING_FIXED_PATH: fixedPath,
        ROUTING_OUTPUT_PATH: outputPath,
      },
    })
    let timedOut = false
    const timer = setTimeout(
      () => {
        timedOut = true
        child.kill("SIGKILL")
      },
      Math.min(budget, remaining),
    )
    const exitCode = await child.exited
    clearTimeout(timer)
    return {
      status: timedOut ? "timed_out" : exitCode === 0 ? "passed" : "failed",
      milliseconds: performance.now() - start,
    }
  }
  if (acceptedStages.length) {
    const result = await run(
      options.stages[acceptedStages.length - 1].validationCommand,
      options.validationTimeoutMs,
      "resume-validation",
      fixedPath,
    )
    if (
      result.status !== "passed" ||
      hash(await readFile(fixedPath)) !== artifactHash
    )
      throw new Error("Saved routing failed revalidation")
  }
  for (const stage of options.stages.slice(acceptedStages.length)) {
    let accepted = false
    for (const [index, attempt] of stage.attempts.entries()) {
      const label = `stage-${acceptedStages.length}-attempt-${index}`
      const outputPath = join(runDirectory, `${label}.json`)
      options.onProgress?.({
        stage: stage.name,
        attempt: attempt.name,
        status: "routing",
      })
      let result = await run(
        attempt.command,
        attempt.timeoutMs,
        label,
        outputPath,
      )
      if (fixedPath && hash(await readFile(fixedPath)) !== artifactHash)
        throw new Error("Worker modified accepted copper")
      let candidate: Buffer | undefined
      if (result.status === "passed") {
        try {
          candidate = await readFile(outputPath)
          JSON.parse(candidate.toString())
        } catch {
          result.status = "missing_or_invalid_output"
        }
      }
      if (candidate && result.status === "passed") {
        options.onProgress?.({
          stage: stage.name,
          attempt: attempt.name,
          status: "validating",
        })
        const validation = await run(
          stage.validationCommand,
          options.validationTimeoutMs,
          `${label}-validation`,
          outputPath,
        )
        const unchanged = hash(await readFile(outputPath)) === hash(candidate)
        result = {
          status:
            validation.status === "passed" && unchanged
              ? "validated"
              : "validation_failed",
          milliseconds: result.milliseconds + validation.milliseconds,
        }
      }
      if (fixedPath && hash(await readFile(fixedPath)) !== artifactHash)
        throw new Error("Validator modified accepted copper")
      attempts.push({ stage: stage.name, attempt: attempt.name, ...result })
      if (result.status === "validated" && candidate) {
        artifactHash = hash(candidate)
        fixedPath = join(options.checkpointDirectory, `${artifactHash}.json`)
        await writeFile(fixedPath + ".tmp", candidate)
        await rename(fixedPath + ".tmp", fixedPath)
        acceptedStages.push(stage.name)
        await writeFile(
          checkpointPath + ".tmp",
          JSON.stringify(
            {
              version: 2,
              inputHash,
              configurationHash,
              acceptedStages,
              artifactHash,
            },
            null,
            2,
          ),
        )
        await rename(checkpointPath + ".tmp", checkpointPath)
        accepted = true
        break
      }
      if (performance.now() - started >= options.totalTimeoutMs) break
    }
    if (!accepted)
      return {
        status: "incomplete" as const,
        acceptedStages,
        attempts,
        artifactPath: fixedPath,
        milliseconds: performance.now() - started,
      }
  }
  return {
    status: "validated" as const,
    acceptedStages,
    attempts,
    artifactPath: fixedPath,
    milliseconds: performance.now() - started,
  }
}
