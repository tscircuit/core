#!/usr/bin/env node

import { readdirSync, statSync, readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testsDir = join(__dirname, "..", "tests")
const workflowFile = join(
  __dirname,
  "..",
  ".github",
  "workflows",
  "bun-test.yml",
)

// Get all directories in tests/ that contain test files
function getTestDirectories() {
  const entries = readdirSync(testsDir)
  const testDirs = []

  for (const entry of entries) {
    const fullPath = join(testsDir, entry)

    // Skip non-directories
    if (!statSync(fullPath).isDirectory()) continue

    // Skip hidden directories and fixtures
    if (entry.startsWith(".") || entry === "fixtures") continue

    // Check if directory contains test files
    if (hasTestFiles(fullPath)) {
      testDirs.push(entry)
    }
  }

  return testDirs.sort()
}

// Check if a directory contains test files (recursively)
function hasTestFiles(dirPath) {
  try {
    const entries = readdirSync(dirPath)

    for (const entry of entries) {
      const fullPath = join(dirPath, entry)
      const stat = statSync(fullPath)

      if (
        stat.isFile() &&
        (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx"))
      ) {
        return true
      }

      if (stat.isDirectory() && hasTestFiles(fullPath)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}`)
    return false
  }
}

// Extract test directories from workflow file
function getWorkflowTestDirectories() {
  const workflowContent = readFileSync(workflowFile, "utf8")

  // Look for the matrix test-dir configuration
  const matrixMatch = workflowContent.match(/test-dir:\s*\[(.*?)\]/s)

  if (!matrixMatch) {
    throw new Error(
      "Could not find test-dir matrix configuration in workflow file",
    )
  }

  const matrixContent = matrixMatch[1]
  const dirs = matrixContent
    .split(",")
    .map((dir) => dir.trim().replace(/['"]/g, ""))
    .filter((dir) => dir.length > 0)
    .sort()

  return dirs
}

function main() {
  console.log("🔍 Validating test matrix configuration...")

  const actualTestDirs = getTestDirectories()
  const workflowTestDirs = getWorkflowTestDirectories()

  console.log(
    `Found ${actualTestDirs.length} test directories:`,
    actualTestDirs,
  )
  console.log(
    `Workflow covers ${workflowTestDirs.length} directories:`,
    workflowTestDirs,
  )

  const missing = actualTestDirs.filter(
    (dir) => !workflowTestDirs.includes(dir),
  )
  const extra = workflowTestDirs.filter((dir) => !actualTestDirs.includes(dir))

  if (missing.length > 0) {
    console.error(
      "❌ ERROR: The following test directories are NOT covered by the workflow matrix:",
    )
    for (const dir of missing) {
      console.error(`  - ${dir}`)
    }
    console.error(
      "\nPlease add these directories to the test-dir matrix in .github/workflows/bun-test.yml",
    )
  }

  if (extra.length > 0) {
    console.warn(
      "⚠️  WARNING: The following directories in the workflow matrix do not contain test files:",
    )
    for (const dir of extra) {
      console.warn(`  - ${dir}`)
    }
    console.warn(
      "\nConsider removing these from the test-dir matrix in .github/workflows/bun-test.yml",
    )
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(
      "✅ All test directories are properly covered by the workflow matrix!",
    )
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main()
