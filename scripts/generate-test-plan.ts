#!/usr/bin/env bun

import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { Glob } from "bun"
import timings from "../.github/test-timings.json"

const DEFAULT_NODE_COUNT = 4
const TEST_PLAN_DIRECTORY = ".github/test-plans"

function getNodeCount(): number {
  const configuredNodeCount = process.env.TEST_PLAN_NODE_COUNT
  if (!configuredNodeCount) return DEFAULT_NODE_COUNT
  const nodeCount = Number(configuredNodeCount)
  if (!Number.isInteger(nodeCount) || nodeCount < 1) {
    throw new Error(
      `TEST_PLAN_NODE_COUNT must be a positive integer, received: ${configuredNodeCount}`,
    )
  }
  return nodeCount
}

export function balanceTestFiles(
  testFiles: string[],
  nodeCount: number,
  durationMsByFile: Record<string, number>,
) {
  // The suite mean gives new files a useful weight until CI measures them.
  const measuredDurations = testFiles
    .map((file) => durationMsByFile[file])
    .filter((duration) => Number.isFinite(duration) && duration >= 0)
  const fallbackMs = measuredDurations.length
    ? measuredDurations.reduce((sum, duration) => sum + duration, 0) /
      measuredDurations.length
    : 1000
  const estimateMs = (file: string) => {
    const duration = durationMsByFile[file]
    return Number.isFinite(duration) && duration >= 0
      ? Math.max(1, duration)
      : fallbackMs
  }
  const plans = Array.from({ length: nodeCount }, () => ({
    files: [] as string[],
    estimatedMs: 0,
  }))

  // Longest processing time first: reserve room for expensive files, then fill
  // the least-loaded shard. Tie-breaks keep plans identical on every runner.
  const sortedFiles = [...testFiles].sort(
    (a, b) => estimateMs(b) - estimateMs(a) || (a < b ? -1 : a > b ? 1 : 0),
  )
  for (const file of sortedFiles) {
    const plan = plans.reduce((leastLoaded, candidate) =>
      candidate.estimatedMs < leastLoaded.estimatedMs ||
      (candidate.estimatedMs === leastLoaded.estimatedMs &&
        candidate.files.length < leastLoaded.files.length)
        ? candidate
        : leastLoaded,
    )
    plan.files.push(file)
    plan.estimatedMs += estimateMs(file)
  }
  return plans
}

if (import.meta.main) {
  const allTestFiles = Array.from(
    new Glob("tests/**/*.test.{ts,tsx}").scanSync({ cwd: process.cwd() }),
  ).sort()
  const nodeCount = getNodeCount()
  const plans = balanceTestFiles(
    allTestFiles,
    nodeCount,
    timings.durationMsByFile,
  )
  const unmeasured = allTestFiles.filter(
    (file) => !(file in timings.durationMsByFile),
  )
  console.log(
    `Found ${allTestFiles.length} test files (${unmeasured.length} new)`,
  )
  rmSync(TEST_PLAN_DIRECTORY, { recursive: true, force: true })
  mkdirSync(TEST_PLAN_DIRECTORY, { recursive: true })
  for (const [nodeIndex, plan] of plans.entries()) {
    const planFile = `${TEST_PLAN_DIRECTORY}/node${nodeIndex + 1}-testplan.txt`
    writeFileSync(planFile, `${plan.files.join("\n")}\n`, "utf8")
    console.log(
      `${planFile}: ${plan.files.length} files, estimated ${(plan.estimatedMs / 1000).toFixed(1)}s`,
    )
  }
}
