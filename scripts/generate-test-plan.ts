#!/usr/bin/env bun

import { writeFileSync, mkdirSync } from "fs"
import { Glob } from "bun"

interface TestMatrix {
  nodeCount: number
  globPatterns: string[]
}

// Configuration for test matrix
const TEST_MATRIX: TestMatrix = {
  nodeCount: 4,
  globPatterns: [
    "tests/components/normal-components/**/*.test.tsx",
    "tests/components/primitive-components/**/*.test.tsx",
    "tests/repros/**/*.test.tsx",
    "tests/examples/**/*.test.tsx",
    // Catchall pattern - will match any remaining tests
    "tests/**/*.test.{ts,tsx}",
  ],
}

function getAllTestFiles(): string[] {
  const glob = new Glob("tests/**/*.test.{ts,tsx}")
  const allTests = Array.from(glob.scanSync({ cwd: process.cwd() }))
  return allTests.sort()
}

function generateTestPlans() {
  const allTestFiles = getAllTestFiles()
  console.log(`Found ${allTestFiles.length} total test files`)

  // Track which files have been claimed
  const claimedFiles = new Set<string>()
  const nodePlans: string[][] = Array.from(
    { length: TEST_MATRIX.nodeCount },
    () => [],
  )

  // Process each glob pattern
  for (
    let patternIdx = 0;
    patternIdx < TEST_MATRIX.globPatterns.length;
    patternIdx++
  ) {
    const pattern = TEST_MATRIX.globPatterns[patternIdx]

    // Find files matching this pattern
    const glob = new Glob(pattern)
    const matchingFiles = Array.from(
      glob.scanSync({ cwd: process.cwd() }),
    ).sort()

    // Filter to only unclaimed files
    const unclaimedMatches = matchingFiles.filter((f) => !claimedFiles.has(f))

    console.log(`\nPattern ${patternIdx + 1}: ${pattern}`)
    console.log(
      `  Matched ${matchingFiles.length} files, ${unclaimedMatches.length} unclaimed`,
    )

    // Distribute unclaimed files across nodes in round-robin fashion
    unclaimedMatches.forEach((file, idx) => {
      const nodeIdx = idx % TEST_MATRIX.nodeCount
      nodePlans[nodeIdx].push(file)
      claimedFiles.add(file)
    })
  }

  // Check for any unclaimed files (shouldn't happen with catchall)
  const unclaimedFiles = allTestFiles.filter((f) => !claimedFiles.has(f))
  if (unclaimedFiles.length > 0) {
    console.warn(
      `\n⚠️  Warning: ${unclaimedFiles.length} files were not claimed by any pattern:`,
    )
    unclaimedFiles.forEach((f) => console.warn(`  - ${f}`))
  }

  // Write test plans to files
  console.log(`\n📝 Writing test plans for ${TEST_MATRIX.nodeCount} nodes...`)
  mkdirSync(".github/test-plans", { recursive: true })
  for (let i = 0; i < TEST_MATRIX.nodeCount; i++) {
    const planFile = `.github/test-plans/node${i + 1}-testplan.txt`
    const content = nodePlans[i].join("\n")
    writeFileSync(planFile, content, "utf8")
    console.log(`  ${planFile}: ${nodePlans[i].length} tests`)
  }

  console.log(`\n✅ Test plans generated successfully!`)
  console.log(`   Total files: ${allTestFiles.length}`)
  console.log(`   Claimed: ${claimedFiles.size}`)
  console.log(`   Unclaimed: ${unclaimedFiles.length}`)
}

generateTestPlans()
