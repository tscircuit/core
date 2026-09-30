#!/usr/bin/env bun

import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
import { Glob } from "bun"

export function readTestTimes(log: string): Record<string, number> {
  const durationMsByFile: Record<string, number> = {}
  // gh run view --log interleaves jobs and prefixes each line with tabs.
  const currentFileByJob = new Map<string, string>()
  for (const rawLine of log.split("\n")) {
    const line = rawLine.replace(/\x1b\[[0-9;]*m/g, "")
    const job = line.includes("\t") ? line.split("\t")[0] : "local"
    const heading = line.match(
      /(?:^|\s|##\[group\])(tests\/.*\.test\.tsx?):\s*$/,
    )
    if (heading) {
      currentFileByJob.set(job, heading[1])
      durationMsByFile[heading[1]] ??= 0
      continue
    }
    const result = line.match(/(?:\((?:pass|fail)\)|[✓✗]).*\[([\d.]+)ms\]/)
    const file = currentFileByJob.get(job)
    if (result && file) durationMsByFile[file] += Number(result[1])
  }
  return durationMsByFile
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const update = args.includes("--update")
  const logPaths = args.filter((arg) => arg !== "--update")
  if (!logPaths.length) throw new Error("Pass one or more Bun test log paths")
  const samplesByFile = new Map<string, number[]>()
  for (const logPath of logPaths) {
    for (const [file, duration] of Object.entries(
      readTestTimes(readFileSync(logPath, "utf8")),
    )) {
      // Files containing only skipped tests have no usable timing sample.
      if (duration <= 0) continue
      const samples = samplesByFile.get(file) ?? []
      samples.push(duration)
      samplesByFile.set(file, samples)
    }
  }
  if (!samplesByFile.size) throw new Error("No test timings found in logs")
  const durationMsByFile = Object.fromEntries(
    [...samplesByFile]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([file, samples]) => [
        file,
        Math.round(
          samples.reduce((sum, duration) => sum + duration, 0) / samples.length,
        ),
      ]),
  )
  const slowest = Object.entries(durationMsByFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  const totalMs = Object.values(durationMsByFile).reduce(
    (sum, duration) => sum + duration,
    0,
  )
  const report = [
    "### Test timings",
    "",
    `${samplesByFile.size} measured files; ${(totalMs / 1000).toFixed(1)}s total test time. Files over 30s warrant investigation (explicit test timeouts can override the CI default).`,
    "",
    "| Test file | Time (s) |",
    "| --- | ---: |",
    ...slowest.map(
      ([file, duration]) => `| ${file} | ${(duration / 1000).toFixed(2)} |`,
    ),
    "",
  ].join("\n")
  console.log(report)
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`)
  if (update) {
    const manifestPath = ".github/test-timings.json"
    const previous = JSON.parse(readFileSync(manifestPath, "utf8"))
    const testFiles = Array.from(
      new Glob("tests/**/*.test.{ts,tsx}").scanSync(),
    )
    const merged = Object.fromEntries(
      testFiles.sort().flatMap((file) => {
        const duration =
          durationMsByFile[file] ?? previous.durationMsByFile[file]
        return duration === undefined ? [] : [[file, duration]]
      }),
    )
    writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          source: logPaths.map((path) => path.split("/").pop()),
          durationMsByFile: merged,
        },
        null,
        2,
      )}\n`,
    )
  }
}
