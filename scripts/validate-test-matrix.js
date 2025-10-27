#!/usr/bin/env node

import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { globSync } from "glob"

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

// Get all test files in tests/ directory
function getAllTestFiles() {
  const pattern = "tests/**/*.test.{ts,tsx}"
  const files = globSync(pattern, {
    ignore: ["**/node_modules/**", "**/fixtures/**", "**/.claude/**"],
    cwd: join(__dirname, ".."),
    posix: true,
  })

  // Normalize paths to forward slashes for cross-platform consistency
  return files.map((f) => f.replace(/\\/g, "/")).sort()
}

// Extract glob patterns from workflow file
function getWorkflowPatterns() {
  const workflowContent = readFileSync(workflowFile, "utf8")

  // Look for the matrix include configuration with patterns
  // Handle comments between matrix: and include:
  const includeMatch = workflowContent.match(
    /matrix:[\s\S]*?include:(.*?)(?=[\r\n]+\s*steps:|[\r\n]{3,})/s,
  )

  if (!includeMatch) {
    throw new Error(
      "Could not find matrix include configuration in workflow file",
    )
  }

  const includeContent = includeMatch[1]
  const patterns = []

  // Extract pattern and index pairs
  const patternRegex =
    /- pattern:\s*["']([^"']+)["']\s*[\r\n]+\s*index:\s*(\d+)/g
  let match

  while ((match = patternRegex.exec(includeContent)) !== null) {
    patterns.push({
      pattern: match[1],
      index: parseInt(match[2], 10),
    })
  }

  return patterns.sort((a, b) => a.index - b.index)
}

// Convert glob pattern to regex for matching
function globToRegex(pattern) {
  // Handle multiple patterns separated by spaces
  if (pattern.includes(" ")) {
    const parts = pattern.split(/\s+/)
    const regexes = parts.map((p) => globToRegex(p))
    const sources = regexes.map((r) => r.source.slice(1, -1))
    return new RegExp("^(?:" + sources.join("|") + ")$")
  }

  let regex = pattern

  // Handle brace expansion: {ts,tsx} -> (ts|tsx)
  regex = regex.replace(/\{([^}]+)\}/g, (match, content) => {
    const options = content.split(",")
    return "(" + options.join("|") + ")"
  })

  // Temporarily protect character classes from dot escaping
  const charClasses = []
  regex = regex.replace(/\[([^\]]+)\]/g, (match) => {
    const index = charClasses.length
    charClasses.push(match)
    return `<<CHARCLASS_${index}>>`
  })

  // Escape dots
  regex = regex.replace(/\./g, "\\.")

  // Handle globstar (**) - must be before single star
  regex = regex.replace(/\*\*/g, "<<GLOBSTAR>>")

  // Handle single star (*)
  regex = regex.replace(/\*/g, "[^/]*")

  // Restore globstar
  regex = regex.replace(/<<GLOBSTAR>>/g, ".*")

  // Handle question mark
  regex = regex.replace(/\?/g, ".")

  // Restore character classes
  for (let i = 0; i < charClasses.length; i++) {
    regex = regex.replace(`<<CHARCLASS_${i}>>`, charClasses[i])
  }

  try {
    return new RegExp("^" + regex + "$")
  } catch (e) {
    throw new Error(
      `Invalid regex pattern for glob "${pattern}": ${regex}\n${e.message}`,
    )
  }
}

// Simulate the exclusion logic from the workflow
function getCoveredFiles(patterns) {
  const allTestFiles = getAllTestFiles()
  const coveredFiles = new Set()
  const patternCoverage = []

  for (let i = 0; i < patterns.length; i++) {
    const currentPattern = patterns[i]
    const regex = globToRegex(currentPattern.pattern)

    // Find files matching current pattern
    const matchingFiles = allTestFiles.filter((f) => regex.test(f))

    // Exclude files already covered by previous patterns
    const newFiles = matchingFiles.filter((f) => !coveredFiles.has(f))

    newFiles.forEach((f) => coveredFiles.add(f))

    patternCoverage.push({
      pattern: currentPattern.pattern,
      index: currentPattern.index,
      fileCount: newFiles.length,
      files: newFiles,
    })
  }

  return { coveredFiles, patternCoverage }
}

function main() {
  console.log("🔍 Validating test matrix configuration...")

  const allTestFiles = getAllTestFiles()
  const patterns = getWorkflowPatterns()

  console.log(`Found ${allTestFiles.length} test files in total`)
  console.log(`Workflow has ${patterns.length} glob patterns configured`)
  console.log()

  const { coveredFiles, patternCoverage } = getCoveredFiles(patterns)

  // Display coverage per pattern
  console.log("Pattern coverage:")
  for (const coverage of patternCoverage) {
    console.log(
      `  [${coverage.index}] ${coverage.pattern}: ${coverage.fileCount} files`,
    )
  }
  console.log()

  // Find uncovered files
  const uncoveredFiles = allTestFiles.filter((f) => !coveredFiles.has(f))

  if (uncoveredFiles.length > 0) {
    console.error(
      "❌ ERROR: " +
        uncoveredFiles.length +
        " test files are NOT covered by any glob pattern:",
    )
    for (const file of uncoveredFiles.slice(0, 20)) {
      console.error(`  - ${file}`)
    }
    if (uncoveredFiles.length > 20) {
      console.error(`  ... and ${uncoveredFiles.length - 20} more`)
    }
    console.error(
      "\nPlease add or adjust glob patterns in .github/workflows/bun-test.yml",
    )
    console.error("The catchall pattern should capture any remaining files.")
    process.exit(1)
  }

  // Warn about empty patterns
  const emptyPatterns = patternCoverage.filter((c) => c.fileCount === 0)
  if (emptyPatterns.length > 0) {
    console.warn(
      "⚠️  WARNING: " +
        emptyPatterns.length +
        " patterns do not match any new files:",
    )
    for (const pattern of emptyPatterns) {
      console.warn(`  [${pattern.index}] ${pattern.pattern}`)
    }
    console.warn(
      "\nConsider removing these patterns or adjusting them in .github/workflows/bun-test.yml",
    )
  }

  console.log(
    "✅ All " +
      allTestFiles.length +
      " test files are covered by the workflow matrix!",
  )
  process.exit(0)
}

main()
