#!/usr/bin/env bun

import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { Glob } from "bun"

import durations from "../.github/test-durations.json"
import { balanceTestPlans } from "./lib/balance-test-plans"

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

function getAllTestFiles(): string[] {
  const glob = new Glob("tests/**/*.test.{ts,tsx}")
  const allTests = Array.from(glob.scanSync({ cwd: process.cwd() }))
  return allTests.sort()
}

function generateTestPlans() {
  const allTestFiles = getAllTestFiles()
  console.log(`Found ${allTestFiles.length} total test files`)

  const nodeCount = getNodeCount()
  const nodePlans = balanceTestPlans(allTestFiles, nodeCount, durations)

  // Write test plans to files
  console.log(`\n📝 Writing test plans for ${nodeCount} nodes...`)
  rmSync(TEST_PLAN_DIRECTORY, { recursive: true, force: true })
  mkdirSync(TEST_PLAN_DIRECTORY, { recursive: true })
  for (let i = 0; i < nodeCount; i++) {
    const planFile = `${TEST_PLAN_DIRECTORY}/node${i + 1}-testplan.txt`
    const content = nodePlans[i].files.join("\n")
    writeFileSync(planFile, content, "utf8")
    console.log(
      `  ${planFile}: ${nodePlans[i].files.length} tests, estimated ${(nodePlans[i].durationMs / 1000).toFixed(1)}s`,
    )
  }

  console.log(`\n✅ Test plans generated successfully!`)
  console.log(`   Total files: ${allTestFiles.length}`)
}

generateTestPlans()
