This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.cursor/
  rules/
    use-bun-instead-of-node-vite-npm-pnpm.mdc
.github/
  workflows/
    bun-formatcheck.yml
    bun-pver-release.yml
    bun-test.yml
    bun-typecheck.yml
lib/
  CssGrid/
    CssGrid_convertToHtml.ts
    CssGrid_layout.ts
    CssGrid_visualize.ts
    CssGrid.ts
  colors.ts
  index.ts
  types.ts
  visualizeBrowserResult.ts
scripts/
  generate-browser-results.ts
site/
  level01.page.tsx
  level02.page.tsx
  level03.page.tsx
  level04.page.tsx
  level05.page.tsx
  level06.page.tsx
  level07.page.tsx
  level08.page.tsx
  level09.page.tsx
  level10.page.tsx
  level11.page.tsx
  level12.page.tsx
  level13.page.tsx
  level14.page.tsx
  level15.page.tsx
  level16.page.tsx
  LevelDisplay.tsx
testcases/
  level01.browser-result.json
  level01.ts
  level02.browser-result.json
  level02.ts
  level03.browser-result.json
  level03.ts
  level04.browser-result.json
  level04.ts
  level05.browser-result.json
  level05.ts
  level06.browser-result.json
  level06.ts
  level07.browser-result.json
  level07.ts
  level08.browser-result.json
  level08.ts
  level09.browser-result.json
  level09.ts
  level10.browser-result.json
  level10.ts
  level11.browser-result.json
  level11.ts
  level12.browser-result.json
  level12.ts
  level13.browser-result.json
  level13.ts
  level14.browser-result.json
  level14.ts
  level15.browser-result.json
  level15.ts
  level16.browser-result.json
  level16.ts
  level17.browser-result.json
  level17.ts
tests/
  __snapshots__/
    level01.snap.svg
    level02.snap.svg
    level03.snap.svg
    level04.snap.svg
    level05.snap.svg
    level06.snap.svg
    level07.snap.svg
    level08.snap.svg
    level09.snap.svg
    level10.snap.svg
    level11.snap.svg
    level12.snap.svg
    level13.snap.svg
    level14.snap.svg
    level15.snap.svg
    level16.snap.svg
    level17.snap.svg
  fixtures/
    preload.ts
    testGrid.ts
  level01.test.ts
  level02.test.ts
  level03.test.ts
  level04.test.ts
  level05.test.ts
  level06.test.ts
  level07.test.ts
  level08.test.ts
  level09.test.ts
  level10.test.ts
  level11.test.ts
  level12.test.ts
  level13.test.ts
  level14.test.ts
  level15.test.ts
  level16.test.ts
  level17.test.ts
.gitignore
biome.json
bunfig.toml
CLAUDE.md
cosmos.config.json
index.html
LICENSE
package.json
playwright.config.ts
README.md
tsconfig.json
vite.config.ts
```

# Files

## File: .cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc
````
../../CLAUDE.md
````

## File: .github/workflows/bun-formatcheck.yml
````yaml
# Created using @tscircuit/plop (npm install -g @tscircuit/plop)
name: Format Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  format-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run format check
        run: bun run format:check
````

## File: .github/workflows/bun-pver-release.yml
````yaml
# Created using @tscircuit/plop (npm install -g @tscircuit/plop)
name: Publish to npm
on:
  push:
    branches:
      - main
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.TSCIRCUIT_BOT_GITHUB_TOKEN }}
      - name: Setup bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/
      - run: npm install -g pver
      - run: bun install --frozen-lockfile
      - run: bun run build
      - run: pver release
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.TSCIRCUIT_BOT_GITHUB_TOKEN }}
````

## File: .github/workflows/bun-test.yml
````yaml
# Created using @tscircuit/plop (npm install -g @tscircuit/plop)
name: Bun Test

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test
````

## File: .github/workflows/bun-typecheck.yml
````yaml
# Created using @tscircuit/plop (npm install -g @tscircuit/plop)
name: Type Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  type-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun i

      - name: Run type check
        run: bunx tsc --noEmit
````

## File: lib/CssGrid/CssGrid_convertToHtml.ts
````typescript
import type { CssGridOptions } from "lib/types"
import type { CssGrid } from "./CssGrid"
import { getColor } from "lib/colors"

export const CssGrid_convertToHtml = (grid: CssGrid) => {
  // helper to turn a template value into valid CSS text
  const stringifyTemplate = (tpl?: string | string[]) =>
    !tpl ? undefined : typeof tpl === "string" ? tpl : tpl.join(" ")

  /* ───────────── 1. build container style ───────────── */
  const s: string[] = ["display:grid", "background-color:gray"]

  const {
    gridTemplateRows,
    gridTemplateColumns,
    gap,
    justifyItems,
    alignItems,
    containerWidth,
    containerHeight,
  } = grid.opts

  const tRows = stringifyTemplate(gridTemplateRows)
  if (tRows) s.push(`grid-template-rows:${tRows}`)

  const tCols = stringifyTemplate(gridTemplateColumns)
  if (tCols) s.push(`grid-template-columns:${tCols}`)

  if (gap !== undefined) {
    if (typeof gap === "number") {
      s.push(`gap:${gap}px`)
    } else {
      const [rowGap, colGap] = gap
      s.push(`row-gap:${rowGap}px`, `column-gap:${colGap}px`)
    }
  }

  if (justifyItems) s.push(`justify-items:${justifyItems}`)
  if (alignItems) s.push(`align-items:${alignItems}`)
  if (containerWidth != null) s.push(`width:${containerWidth}px`)
  if (containerHeight != null) s.push(`height:${containerHeight}px`)

  const containerStyle = s.join(";")

  /* ───────────── 2. build children markup ───────────── */
  const childDivs = grid.opts.children.map((c) => {
    const cs: string[] = ["display:flex", `background-color:${getColor(c.key)}`]

    /* placement ------------------------------------------------ */
    // 1. Named area still has top priority
    if (c.area) {
      cs.push(`grid-area:${c.area}`)
    } else {
      /* ----- rows ----- */
      // full custom string always wins (e.g. "2 / span 3")
      if (typeof c.row === "string" && c.row.includes("/")) {
        cs.push(`grid-row:${c.row}`)
      } else {
        const start = c.rowStart ?? c.row // alias handling
        const end = c.rowEnd
        const span = c.rowSpan

        if (start !== undefined || end !== undefined) {
          if (start !== undefined && end !== undefined) {
            cs.push(`grid-row:${start} / ${end}`)
          } else if (start !== undefined) {
            span !== undefined
              ? cs.push(`grid-row:${start} / span ${span}`)
              : cs.push(`grid-row-start:${start}`)
          } else {
            // only end
            cs.push(`grid-row-end:${end}`)
          }
        } else if (span !== undefined) {
          // no explicit start/end → just a span
          cs.push(`grid-row:auto / span ${span}`)
        }
      }

      /* ----- columns ----- */
      if (typeof c.column === "string" && c.column.includes("/")) {
        cs.push(`grid-column:${c.column}`)
      } else {
        const start = c.columnStart ?? c.column // alias handling
        const end = c.columnEnd
        const span = c.columnSpan

        if (start !== undefined || end !== undefined) {
          if (start !== undefined && end !== undefined) {
            cs.push(`grid-column:${start} / ${end}`)
          } else if (start !== undefined) {
            span !== undefined
              ? cs.push(`grid-column:${start} / span ${span}`)
              : cs.push(`grid-column-start:${start}`)
          } else {
            cs.push(`grid-column-end:${end}`)
          }
        } else if (span !== undefined) {
          cs.push(`grid-column:auto / span ${span}`)
        }
      }
    }

    const childStyle = cs.join(";")

    // Build inner div style with contentWidth/contentHeight if provided
    const innerStyles: string[] = ["font-size: 7px"]

    if (c.contentWidth !== undefined) {
      const width =
        typeof c.contentWidth === "string"
          ? c.contentWidth
          : `${c.contentWidth}px`
      innerStyles.push(`width:${width}`)
    } else {
      innerStyles.push(`width:${c.key.length * 5}px`)
    }

    if (c.contentHeight !== undefined) {
      const height =
        typeof c.contentHeight === "string"
          ? c.contentHeight
          : `${c.contentHeight}px`
      innerStyles.push(`height:${height}`)
    }

    const innerStyle = innerStyles.join(";")
    return `  <div id="${c.key}" style="${childStyle}"><div style="${innerStyle}">${c.key}</div></div>`
  })

  /* ───────────── 3. final HTML string ───────────── */
  return `<div style="${containerStyle}">\n${childDivs.join("\n")}\n</div>`
}
````

## File: lib/CssGrid/CssGrid_layout.ts
````typescript
import type { CssGrid, GridCell } from "./CssGrid"

// --- Helpers ---

// Expand repeat(N, X) into X X X...
function expandRepeat(templateStr: string): string {
  // Only handles single-level repeat(N, X) as used in the repo
  return templateStr.replace(/repeat\((\d+),\s*([^)]+)\)/g, (_, count, val) =>
    Array(Number(count)).fill(val.trim()).join(" "),
  )
}

// Tokenize a template string into track tokens
function tokenize(templateStr: string): string[] {
  // Split by whitespace, ignore empty
  return templateStr.trim().split(/\s+/).filter(Boolean)
}

// Returns number of tracks in a template string
function countTracks(tpl?: string): number {
  if (!tpl) return 0
  return tokenize(expandRepeat(tpl)).length
}

// pxFromToken: returns px value or undefined for "fr"
function pxFromToken(
  token: string,
  containerSize: number | undefined,
): number | undefined | { fr: number } {
  if (token === "auto") {
    return { fr: 1 }
  }
  if (token.endsWith("%")) {
    const n = parseFloat(token)
    return containerSize != null ? (containerSize * n) / 100 : 0
  }
  if (token.endsWith("px")) {
    return parseFloat(token)
  }
  if (token.endsWith("em")) {
    return parseFloat(token) * 16
  }
  if (token.endsWith("fr")) {
    return { fr: parseFloat(token) }
  }
  // fallback: treat as px if number
  const n = parseFloat(token)
  if (!Number.isNaN(n)) return n
  return 0
}

// CSS negative line index resolution
function resolveNegativeLine(idx: number, trackCnt: number): number {
  return idx > 0 ? idx : trackCnt + 2 + idx
}

export const CssGrid_layout = (
  grid: CssGrid,
): {
  cells: GridCell[]
  rowSizes: number[]
  columnSizes: number[]
  rowGap: number
  columnGap: number
  itemCoordinates: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >
} => {
  const opts = grid.opts
  const children = opts.children

  // --- 2. Parse user options for templates ---
  let rowsTpl: string | undefined
  let colsTpl: string | undefined

  if ("gridTemplate" in opts && typeof opts.gridTemplate === "string") {
    // e.g. "1fr 2fr / 100px 1fr"
    const [rows, cols] = opts.gridTemplate.split("/")
    rowsTpl = rows?.trim()
    colsTpl = cols?.trim()
  } else {
    rowsTpl =
      typeof opts.gridTemplateRows === "string"
        ? opts.gridTemplateRows
        : undefined
    colsTpl =
      typeof opts.gridTemplateColumns === "string"
        ? opts.gridTemplateColumns
        : undefined
  }

  const columnTrackCountDeclared = countTracks(colsTpl)
  const rowTrackCountDeclared = countTracks(rowsTpl)

  // --- 3. Auto-sizing helper functions ---

  // Calculate minimum container size needed for auto-sizing
  function calculateMinimumContainerSize(
    tpl: string | undefined,
    children: typeof opts.children,
    isWidth: boolean,
    gap: number,
  ): number {
    if (!tpl) return 0

    const expanded = expandRepeat(tpl)
    const tokens = tokenize(expanded)
    const trackCount = tokens.length

    // Calculate minimum size needed based on content
    let minContentSize = 0
    let hasFlexibleTracks = false

    // First pass: calculate minimum size from fixed tracks and content
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!

      if (token.endsWith("px")) {
        minContentSize += parseFloat(token)
      } else if (token.endsWith("em")) {
        minContentSize += parseFloat(token) * 16
      } else if (token.endsWith("fr") || token === "auto") {
        hasFlexibleTracks = true
        // For fr/auto tracks, use the largest content size in that track
        let maxContentInTrack = 0

        for (const child of children) {
          const childStart = isWidth
            ? child.columnStart || child.column
            : child.rowStart || child.row
          const childSpan = isWidth ? child.columnSpan || 1 : child.rowSpan || 1
          const contentSize = isWidth ? child.contentWidth : child.contentHeight

          // Check if this child occupies this track
          const startIdx =
            (typeof childStart === "number"
              ? childStart
              : parseInt(childStart || "1")) - 1
          const span =
            typeof childSpan === "number"
              ? childSpan
              : parseInt(childSpan.toString())

          if (startIdx <= i && i < startIdx + span) {
            if (contentSize) {
              const size =
                typeof contentSize === "string" && contentSize.endsWith("px")
                  ? parseFloat(contentSize)
                  : typeof contentSize === "number"
                    ? contentSize
                    : 0
              maxContentInTrack = Math.max(maxContentInTrack, size / span) // Distribute across span
            }
          }
        }

        minContentSize += maxContentInTrack
      }
      // For percentage tracks without a container, we'll treat them as content-sized
    }

    // Add gaps
    const totalGaps = gap * (trackCount - 1)
    return minContentSize + totalGaps
  }

  // --- 4. Build numeric track size arrays ---

  function buildTrackSizes(
    tpl: string | undefined,
    containerSize: number | undefined,
    gap: number,
    isWidth = true,
    crossTrackCount = 1, // NEW
  ): number[] {
    if (!tpl) return []

    /* ── Intrinsic track sizing when container size is unknown ───────── */
    if (containerSize == null) {
      const expanded = expandRepeat(tpl)
      const tokens = tokenize(expanded)
      const trackCnt = tokens.length

      // helper – px value from contentWidth / contentHeight (+ 2 px border)
      const toPx = (v: string | number | undefined): number => {
        if (v === undefined) return 0
        if (typeof v === "number") return v
        if (v.endsWith("px")) return parseFloat(v)
        return parseFloat(v)
      }

      // gather the largest content-based size per track
      const sizes = new Array<number>(trackCnt).fill(0)
      let autoCursor = 0 // row-major auto placement

      for (const child of children) {
        const span = isWidth
          ? typeof child.columnSpan === "number"
            ? child.columnSpan
            : child.columnSpan
              ? parseInt(child.columnSpan.toString())
              : 1
          : typeof child.rowSpan === "number"
            ? child.rowSpan
            : child.rowSpan
              ? parseInt(child.rowSpan.toString())
              : 1

        const rawSize = isWidth ? child.contentWidth : child.contentHeight
        const sizePerTrack = toPx(rawSize) / span

        // which track does the item start in?
        let startIdx: number | undefined
        if (isWidth) {
          if (child.columnStart !== undefined || child.column !== undefined) {
            startIdx =
              parseInt((child.columnStart ?? child.column) as string) - 1
          }
        } else {
          if (child.rowStart !== undefined || child.row !== undefined) {
            startIdx = parseInt((child.rowStart ?? child.row) as string) - 1
          }
        }
        // ── determine implicit start track ──
        if (startIdx === undefined || Number.isNaN(startIdx)) {
          if (isWidth) {
            // columns: wrap inside the same row
            startIdx = autoCursor % trackCnt
          } else {
            // rows: CSS grid’s row-major auto-flow – fill columns first
            startIdx = Math.floor(autoCursor / crossTrackCount)
          }
          autoCursor += span
        }

        // distribute over the spanned tracks
        for (let i = 0; i < span && startIdx + i < trackCnt; i++) {
          sizes[startIdx + i] = Math.max(sizes[startIdx + i]!, sizePerTrack)
        }
      }

      // overwrite with any fixed/percentage tokens present
      tokens.forEach((tok, idx) => {
        const px = pxFromToken(tok, undefined)
        if (typeof px === "number") sizes[idx] = px
      })

      return sizes // <- EARLY RETURN
    }

    const expanded = expandRepeat(tpl)
    const tokens = tokenize(expanded)
    const trackCount = tokens.length

    // If no container size, calculate minimum needed for auto-sizing
    let effectiveContainerSize = containerSize
    if (effectiveContainerSize == null) {
      effectiveContainerSize = calculateMinimumContainerSize(
        tpl,
        children,
        isWidth,
        gap,
      )
    }

    const sizeForTracks = effectiveContainerSize - gap * (trackCount - 1)

    // First pass: collect fixed sizes and total fr
    let sumFixed = 0
    let totalFr = 0
    const frTokens: { idx: number; fr: number }[] = []
    const sizes: (number | { fr: number })[] = []
    tokens.forEach((token, i) => {
      const px = pxFromToken(token, sizeForTracks)
      if (typeof px === "number") {
        sizes.push(px)
        sumFixed += px
      } else if (px && typeof px === "object" && "fr" in px) {
        sizes.push(px)
        totalFr += px.fr
        frTokens.push({ idx: i, fr: px.fr })
      } else {
        sizes.push(0)
        sumFixed += 0
      }
    })
    // Compute free space
    const free = Math.max(sizeForTracks - sumFixed, 0)
    // Second pass: assign fr tracks
    return sizes.map((v) =>
      typeof v === "number" ? v : totalFr > 0 ? (free / totalFr) * v.fr : 0,
    )
  }

  const rowGap =
    typeof opts.gap === "number"
      ? opts.gap
      : Array.isArray(opts.gap)
        ? opts.gap[0]
        : 0
  const columnGap =
    typeof opts.gap === "number"
      ? opts.gap
      : Array.isArray(opts.gap)
        ? opts.gap[1]
        : 0

  // rows first
  const rowSizes = buildTrackSizes(
    rowsTpl,
    opts.containerHeight,
    rowGap,
    /* isWidth = */ false,
    /* cross-axis = */ columnTrackCountDeclared || 1,
  )

  const columnSizes = buildTrackSizes(
    colsTpl,
    opts.containerWidth,
    columnGap,
    /* isWidth = */ true,
    /* cross-axis = */ rowTrackCountDeclared || 1,
  )

  const rowCount = rowSizes.length
  const colCount = columnSizes.length

  // --- 4. Item placement (auto-placement, cut-down) ---

  const cells: GridCell[] = []
  let nextAutoCell = 0 // row-major index

  for (const child of children) {
    // Placement: row/col start
    let rowStart: number | string | undefined =
      child.rowStart !== undefined ? child.rowStart : child.row
    let colStart: number | string | undefined =
      child.columnStart !== undefined ? child.columnStart : child.column

    // Spans
    let rowSpan: number =
      child.rowSpan !== undefined
        ? typeof child.rowSpan === "string"
          ? parseInt(child.rowSpan)
          : (child.rowSpan as number)
        : 1
    let colSpan: number =
      child.columnSpan !== undefined
        ? typeof child.columnSpan === "string"
          ? parseInt(child.columnSpan)
          : (child.columnSpan as number)
        : 1

    // End indices (not used for placement, but for span calculation)
    if (child.rowEnd !== undefined) {
      const end =
        typeof child.rowEnd === "string"
          ? parseInt(child.rowEnd)
          : (child.rowEnd as number)
      if (rowStart !== undefined) {
        rowSpan =
          end - (typeof rowStart === "string" ? parseInt(rowStart) : rowStart)
      } else {
        rowStart = end - rowSpan
      }
    }
    if (child.columnEnd !== undefined) {
      const end =
        typeof child.columnEnd === "string"
          ? parseInt(child.columnEnd)
          : (child.columnEnd as number)
      if (colStart !== undefined) {
        colSpan =
          end - (typeof colStart === "string" ? parseInt(colStart) : colStart)
      } else {
        colStart = end - colSpan
      }
    }

    // Parse string indices
    if (typeof rowStart === "string") rowStart = parseInt(rowStart)
    if (typeof colStart === "string") colStart = parseInt(colStart)

    // Negative line indices
    if (typeof rowStart === "number" && rowStart < 0)
      rowStart = resolveNegativeLine(rowStart, rowCount)
    if (typeof colStart === "number" && colStart < 0)
      colStart = resolveNegativeLine(colStart, colCount)

    // Handle partial placement - if only one dimension is specified
    if (rowStart === undefined && colStart !== undefined) {
      // Column specified but not row - place in row 1
      rowStart = 1
    } else if (colStart === undefined && rowStart !== undefined) {
      // Row specified but not column - place in column 1
      colStart = 1
    } else if (rowStart === undefined && colStart === undefined) {
      // Neither specified - use auto-placement
      const idx = nextAutoCell
      rowStart = Math.floor(idx / colCount) + 1
      colStart = (idx % colCount) + 1
    }

    // Compute end indices
    const row = (rowStart as number) - 1
    const column = (colStart as number) - 1

    // Clamp spans to at least 1
    rowSpan = Math.max(1, rowSpan)
    colSpan = Math.max(1, colSpan)

    cells.push({
      key: child.key,
      row,
      column,
      rowSpan,
      columnSpan: colSpan,
      x: 0, // Will be calculated below
      y: 0, // Will be calculated below
      width: 0, // Will be calculated below
      height: 0, // Will be calculated below
    })

    // Advance auto cursor
    nextAutoCell += colSpan
  }

  // --- 5. Ensure size arrays are long enough for implicit tracks ---
  let maxRow = rowSizes.length
  let maxCol = columnSizes.length
  for (const cell of cells) {
    if (cell.row + cell.rowSpan > maxRow) maxRow = cell.row + cell.rowSpan
    if (cell.column + cell.columnSpan > maxCol)
      maxCol = cell.column + cell.columnSpan
  }
  while (rowSizes.length < maxRow) rowSizes.push(0)
  while (columnSizes.length < maxCol) columnSizes.push(0)

  // --- 6. Calculate exact coordinates for each cell ---

  // Helper function to calculate position from track index
  const getPositionFromTracks = (
    trackIndex: number,
    trackSizes: number[],
    gap: number,
  ): number => {
    let position = 0
    for (let i = 0; i < trackIndex; i++) {
      position += trackSizes[i] || 0
      // Add gap after each track we've processed
      position += gap
    }
    return position
  }

  // Helper function to calculate size from span
  const getSizeFromSpan = (
    trackIndex: number,
    span: number,
    trackSizes: number[],
    gap: number,
  ): number => {
    let size = 0
    for (let i = trackIndex; i < trackIndex + span; i++) {
      size += trackSizes[i] || 0
      if (i > trackIndex) size += gap
    }
    return size
  }

  const itemCoordinates: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {}

  // Update cells with coordinates and build itemCoordinates
  for (const cell of cells) {
    // Find the corresponding child to get contentWidth/contentHeight and other properties
    const child = children.find((c) => c.key === cell.key)

    // Calculate grid cell boundaries
    const cellX = getPositionFromTracks(cell.column, columnSizes, columnGap)
    const cellY = getPositionFromTracks(cell.row, rowSizes, rowGap)
    const cellWidth = getSizeFromSpan(
      cell.column,
      cell.columnSpan,
      columnSizes,
      columnGap,
    )
    const cellHeight = getSizeFromSpan(cell.row, cell.rowSpan, rowSizes, rowGap)

    // Get content dimensions (support string or number)
    const getContentDimension = (
      value: string | number | undefined,
    ): number => {
      if (value === undefined) return 0
      if (typeof value === "string") {
        if (value.endsWith("px")) return parseFloat(value)
        if (value.endsWith("%")) return 0 // TODO: implement percentage support
        return parseFloat(value)
      }
      return value
    }

    const contentWidth = getContentDimension(child?.contentWidth)
    const contentHeight = getContentDimension(child?.contentHeight)

    // Calculate actual item dimensions and position based on alignment
    let itemWidth = cellWidth
    let itemHeight = cellHeight
    let itemX = cellX
    let itemY = cellY

    // Apply contentWidth/contentHeight if specified
    if (contentWidth > 0) {
      itemWidth = contentWidth
      // Apply horizontal alignment (justifyItems)
      const justifyItems = opts.justifyItems || "stretch"
      switch (justifyItems) {
        case "start":
          itemX = cellX
          break
        case "end":
          itemX = cellX + cellWidth - itemWidth
          break
        case "center":
          itemX = cellX + (cellWidth - itemWidth) / 2
          break
        case "stretch":
          itemWidth = cellWidth
          itemX = cellX
          break
      }
    }

    if (contentHeight > 0) {
      itemHeight = contentHeight
      // Apply vertical alignment (alignItems)
      const alignItems = opts.alignItems || "stretch"
      switch (alignItems) {
        case "start":
          itemY = cellY
          break
        case "end":
          itemY = cellY + cellHeight - itemHeight
          break
        case "center":
          itemY = cellY + (cellHeight - itemHeight) / 2
          break
        case "stretch":
          itemHeight = cellHeight
          itemY = cellY
          break
      }
    }

    // Update the cell object
    cell.x = itemX
    cell.y = itemY
    cell.width = itemWidth
    cell.height = itemHeight

    // Store in itemCoordinates for easy access
    itemCoordinates[cell.key] = {
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: itemHeight,
    }
  }

  // --- 7. Return assembled object ---
  return {
    cells,
    rowSizes,
    columnSizes,
    rowGap,
    columnGap,
    itemCoordinates,
  }
}
````

## File: lib/CssGrid/CssGrid_visualize.ts
````typescript
import type { GraphicsObject } from "graphics-debug"
import type { CssGrid } from "./CssGrid"
import { getColor } from "lib/colors"

export const CssGrid_visualize = (grid: CssGrid): GraphicsObject => {
  const layout = grid.layout()

  const go: Required<GraphicsObject> = {
    title: "CssGrid",
    coordinateSystem: "screen",
    lines: [],
    circles: [],
    points: [],
    rects: [],
    texts: [],
  }

  const { cells } = layout

  for (const cell of cells) {
    const { x, y, width, height, key } = cell

    go.rects.push({
      center: { x: x + width / 2, y: y + height / 2 },
      width,
      height,
      fill: getColor(key),
      label: key,
    })
  }

  return go
}
````

## File: lib/CssGrid/CssGrid.ts
````typescript
import type { GraphicsObject } from "graphics-debug"

import type { CssGridOptions } from "../types"
import { CssGrid_convertToHtml } from "./CssGrid_convertToHtml"
import { CssGrid_visualize } from "./CssGrid_visualize"
import { CssGrid_layout } from "./CssGrid_layout"

/** Final position of a single grid item (1-based like CSS Grid) */
export interface GridCell {
  key: string
  row: number
  column: number
  rowSpan: number
  columnSpan: number
  x: number
  y: number
  width: number
  height: number
}

export class CssGrid {
  readonly opts: CssGridOptions

  constructor(opts: CssGridOptions) {
    this.opts = opts
    // 1. normalise templates → list of track sizes
    // 2. compute cell positions & final matrix
  }

  /** Returns the computed layout matrix, ready for rendering elsewhere */
  public layout(): {
    cells: GridCell[]
    rowSizes: number[]
    columnSizes: number[]
    rowGap: number
    columnGap: number
    itemCoordinates: Record<
      string,
      { x: number; y: number; width: number; height: number }
    >
  } {
    return CssGrid_layout(this)
  }

  public convertToHtml(): string {
    return CssGrid_convertToHtml(this)
  }

  public visualize(): GraphicsObject {
    return CssGrid_visualize(this)
  }
}
````

## File: lib/colors.ts
````typescript
export const COLORS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
].map((i) => `hsl(${(i * 360) / 21}deg, 100%, 50%)`)
export const stringHash = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
  }
  return hash
}
export const getColor = (str: string): string => {
  return COLORS[Math.abs(stringHash(str)) % COLORS.length]!
}
````

## File: lib/index.ts
````typescript
export * from "./CssGrid/CssGrid"
````

## File: lib/types.ts
````typescript
/* ────────────────────────────────────────────────────────
   Primitive value helpers
   ──────────────────────────────────────────────────────── */
type Fr = `${number}fr` // e.g. "1fr"
type Px = `${number}px` // e.g. "120px"
type Percent = `${number}%` // e.g. "50%"
type Keyword = "auto" | "min-content" | "max-content"
type TrackSize = Fr | Px | Percent | Keyword

/** A single track definition (string) or a repeat/minmax helper */
type Track =
  | TrackSize
  | `minmax(${TrackSize}, ${TrackSize})`
  | `repeat(${number}, ${TrackSize})`

/** A full template as string (CSS‑like) or structured array  */
type GridTemplate = string | Track[]

/* ────────────────────────────────────────────────────────
      Grid‑item description
      ──────────────────────────────────────────────────────── */
interface GridItem {
  /** Stable identifier – never a DOM node */
  key: string

  /* Explicit placement (1‑based like CSS Grid) */
  row?: number | string
  column?: number | string
  rowSpan?: number | string
  columnSpan?: number | string
  rowStart?: number | string
  columnStart?: number | string
  rowEnd?: number | string
  columnEnd?: number | string

  contentWidth?: number | string
  contentHeight?: number | string

  /** Named area (alternative to numeric placement) */
  area?: string

  order?: number | string

  /** Any extra data your engine wants to carry along */
  payload?: unknown
}

/* ────────────────────────────────────────────────────────
      Top‑level configuration object
      ──────────────────────────────────────────────────────── */
export interface CssGridOptions {
  /** All grid items (order irrelevant unless you want it) */
  children: GridItem[]

  /* Track templates */
  gridTemplateRows?: GridTemplate // e.g. "repeat(2, 1fr)" or ['1fr','2fr']
  gridTemplateColumns?: GridTemplate

  /* Gaps in *css‑logical* order: [rowGap, columnGap] */
  gap?: number | [number, number]

  /* Alignment – mirror CSS keywords, but feel free to extend */
  justifyItems?: "start" | "end" | "center" | "stretch"
  alignItems?: "start" | "end" | "center" | "stretch"

  containerWidth?: number
  containerHeight?: number
}

export interface BrowserResultItem {
  x: number
  y: number
  width: number
  height: number
}

export type BrowserResult = Record<string, BrowserResultItem>
````

## File: lib/visualizeBrowserResult.ts
````typescript
import type { GraphicsObject } from "graphics-debug"
import type { BrowserResult } from "./types"
import { getColor } from "./colors"

export const visualizeBrowserResult = (
  browserOutput: BrowserResult,
): GraphicsObject => {
  const go: Required<GraphicsObject> = {
    title: "Browser Result",
    coordinateSystem: "screen",
    points: [],
    lines: [],
    rects: [],
    circles: [],
    texts: [],
  }

  go.lines.push(
    {
      strokeColor: "black",
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 0, y: 100 },
        { x: 0, y: 0 },
      ],
    },
  )

  // Convert each item in browserOutput to a rectangle
  for (const [key, item] of Object.entries(browserOutput)) {
    go.rects.push({
      center: {
        x: item.x + item.width / 2,
        y: item.y + item.height / 2,
      },
      width: item.width,
      height: item.height,
      fill: getColor(key),
      label: key,
    })
  }

  return go
}
````

## File: scripts/generate-browser-results.ts
````typescript
import * as fs from "node:fs"
import * as path from "node:path"
import { chromium, devices } from "playwright"
import { CssGrid } from "lib/CssGrid/CssGrid"
import type { CssGridOptions } from "lib/types"

async function loadTestCases(): Promise<Record<string, CssGridOptions>> {
  const testCases: Record<string, CssGridOptions> = {}
  const testcasesDir = path.join(process.cwd(), "testcases")

  const files = fs.readdirSync(testcasesDir)
  const tsFiles = files.filter(
    (file) => file.endsWith(".ts") && !file.includes("browser-result"),
  )

  for (const file of tsFiles) {
    const testcaseName = path.basename(file, ".ts")
    try {
      const testcaseModule = await import(`../testcases/${testcaseName}`)
      testCases[testcaseName] = testcaseModule.default
    } catch (error) {
      console.warn(`Failed to load testcase ${testcaseName}:`, error)
    }
  }

  return testCases
}

async function generateBrowserResults() {
  const testCases = await loadTestCases()
  console.log(`Found ${Object.keys(testCases).length} test cases`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    viewport: { width: 120, height: 120 },
  })
  const page = await context.newPage()

  for (const [testcasePath, testcaseConfig] of Object.entries(testCases)) {
    // Create CssGrid instance with testcase configuration
    const grid = new CssGrid(testcaseConfig)

    // Generate HTML from the grid
    const htmlContent = grid.convertToHtml()

    // Create a complete HTML page with the grid
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grid Test</title>
        <style>
          body { margin: 0; padding: 0px; font-family: Arial, sans-serif; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `

    // Set the HTML content in the page
    await page.setContent(fullHtml)

    // Extract positions of all named elements
    const elementBounds: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {}

    // Find all div elements with an id attribute
    const childDivs = await page.locator("div[id]").all()

    for (const div of childDivs) {
      const id = await div.getAttribute("id")
      if (id?.trim()) {
        const boundingBox = await div.boundingBox()
        if (boundingBox) {
          elementBounds[id.trim()] = {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          }
        }
      }
    }

    // Save to file
    const outputPath = path.join(
      "testcases",
      `${testcasePath}.browser-result.json`,
    )
    const outputDir = path.dirname(outputPath)

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(elementBounds, null, 2))
    console.log(`Generated browser results for ${testcasePath}`)
  }

  await browser.close()
}

generateBrowserResults().catch(console.error)
````

## File: site/level01.page.tsx
````typescript
import level1 from "testcases/level01"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level1} />
}
````

## File: site/level02.page.tsx
````typescript
import level2 from "testcases/level02"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level2} />
}
````

## File: site/level03.page.tsx
````typescript
import level3 from "testcases/level03"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level3} />
}
````

## File: site/level04.page.tsx
````typescript
import level4 from "testcases/level04"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level4} />
}
````

## File: site/level05.page.tsx
````typescript
import level5 from "testcases/level05"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level5} />
}
````

## File: site/level06.page.tsx
````typescript
import level6 from "testcases/level06"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level6} />
}
````

## File: site/level07.page.tsx
````typescript
import level7 from "testcases/level07"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level7} />
}
````

## File: site/level08.page.tsx
````typescript
import level8 from "testcases/level08"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level8} />
}
````

## File: site/level09.page.tsx
````typescript
import level9 from "testcases/level09"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level9} />
}
````

## File: site/level10.page.tsx
````typescript
import level10 from "testcases/level10"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level10} />
}
````

## File: site/level11.page.tsx
````typescript
import level11 from "testcases/level11"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level11} />
}
````

## File: site/level12.page.tsx
````typescript
import level12 from "testcases/level12"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level12} />
}
````

## File: site/level13.page.tsx
````typescript
import level13 from "testcases/level13"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level13} />
}
````

## File: site/level14.page.tsx
````typescript
import level14 from "testcases/level14"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level14} />
}
````

## File: site/level15.page.tsx
````typescript
import level15 from "testcases/level15"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level15} />
}
````

## File: site/level16.page.tsx
````typescript
import level16 from "testcases/level16"
import { LevelDisplay } from "./LevelDisplay"

export default () => {
  return <LevelDisplay level={level16} />
}
````

## File: site/LevelDisplay.tsx
````typescript
import { getSvgFromGraphicsObject } from "graphics-debug"
import { CssGrid } from "lib/index"

export const LevelDisplay = ({ level }: { level: any }) => {
  const grid = new CssGrid(level)

  const resultGraphics = grid.visualize()
  resultGraphics.lines ??= []
  const maxX = grid.opts.containerWidth ?? 100
  const maxY = grid.opts.containerHeight ?? 100
  resultGraphics.lines.push(
    {
      strokeColor: "black",
      points: [
        { x: 0, y: 0 },
        { x: maxX, y: 0 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: maxX, y: 0 },
        { x: maxX, y: maxY },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: maxX, y: maxY },
        { x: 0, y: maxY },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 0, y: maxY },
        { x: 0, y: 0 },
      ],
    },
  )
  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ width: "50%" }}>
          <h2>Browser Result</h2>
          <div dangerouslySetInnerHTML={{ __html: grid.convertToHtml() }} />
        </div>
        <div>
          <h2>Algorithm Result</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: getSvgFromGraphicsObject(resultGraphics, {
                backgroundColor: "rgba(255,255,255,0.5)",
                svgHeight: 200,
                svgWidth: 200,
              }),
            }}
          />
        </div>
      </div>
      <pre>{JSON.stringify(level, null, 2)}</pre>
    </div>
  )
}
````

## File: testcases/level01.browser-result.json
````json
{
  "water": {
    "x": 40,
    "y": 0,
    "width": 20,
    "height": 20
  }
}
````

## File: testcases/level01.ts
````typescript
import type { CssGridOptions } from "lib/types"

export default {
  children: [{ key: "water", columnStart: 3 }],
  containerWidth: 100,
  containerHeight: 100,
  gridTemplateColumns: "20% 20% 20% 20% 20%",
  gridTemplateRows: "20% 20% 20% 20% 20%",
} satisfies CssGridOptions
````

## File: testcases/level02.browser-result.json
````json
{
  "water": {
    "x": 0,
    "y": 40,
    "width": 20,
    "height": 20
  }
}
````

## File: testcases/level02.ts
````typescript
import type { CssGridOptions } from "lib/types"

export default {
  children: [{ key: "water", rowStart: 3 }],
  containerWidth: 100,
  containerHeight: 100,
  gridTemplateColumns: "20% 20% 20% 20% 20%",
  gridTemplateRows: "20% 20% 20% 20% 20%",
} satisfies CssGridOptions
````

## File: testcases/level03.browser-result.json
````json
{
  "item1": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "item2": {
    "x": 100,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "item3": {
    "x": 0,
    "y": 100,
    "width": 100,
    "height": 100
  },
  "item4": {
    "x": 100,
    "y": 100,
    "width": 100,
    "height": 100
  }
}
````

## File: testcases/level03.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Multiple items with automatic placement
export default {
  children: [
    { key: "item1" },
    { key: "item2" },
    { key: "item3" },
    { key: "item4" },
  ],
  containerWidth: 200,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
} satisfies CssGridOptions
````

## File: testcases/level04.browser-result.json
````json
{
  "header": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 50
  },
  "sidebar": {
    "x": 100,
    "y": 0,
    "width": 200,
    "height": 50
  },
  "content": {
    "x": 0,
    "y": 50,
    "width": 100,
    "height": 120
  },
  "footer": {
    "x": 100,
    "y": 50,
    "width": 200,
    "height": 120
  }
}
````

## File: testcases/level04.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Fixed pixel sizes
export default {
  children: [
    { key: "header" },
    { key: "sidebar" },
    { key: "content" },
    { key: "footer" },
  ],
  containerWidth: 300,
  containerHeight: 200,
  gridTemplateColumns: "100px 1fr",
  gridTemplateRows: "50px 1fr 30px",
} satisfies CssGridOptions
````

## File: testcases/level05.browser-result.json
````json
{
  "box1": {
    "x": 0,
    "y": 0,
    "width": 110,
    "height": 110
  },
  "box2": {
    "x": 130,
    "y": 0,
    "width": 110,
    "height": 110
  },
  "box3": {
    "x": 0,
    "y": 130,
    "width": 110,
    "height": 110
  },
  "box4": {
    "x": 130,
    "y": 130,
    "width": 110,
    "height": 110
  }
}
````

## File: testcases/level05.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Grid gap
export default {
  children: [
    { key: "box1" },
    { key: "box2" },
    { key: "box3" },
    { key: "box4" },
  ],
  containerWidth: 240,
  containerHeight: 240,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  gap: 20,
} satisfies CssGridOptions
````

## File: testcases/level06.browser-result.json
````json
{
  "a": {
    "x": 0,
    "y": 0,
    "width": 80,
    "height": 95
  },
  "b": {
    "x": 110,
    "y": 0,
    "width": 80,
    "height": 95
  },
  "c": {
    "x": 220,
    "y": 0,
    "width": 80,
    "height": 95
  },
  "d": {
    "x": 0,
    "y": 105,
    "width": 80,
    "height": 95
  },
  "e": {
    "x": 110,
    "y": 105,
    "width": 80,
    "height": 95
  },
  "f": {
    "x": 220,
    "y": 105,
    "width": 80,
    "height": 95
  }
}
````

## File: testcases/level06.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Different row and column gaps
export default {
  children: [
    { key: "a" },
    { key: "b" },
    { key: "c" },
    { key: "d" },
    { key: "e" },
    { key: "f" },
  ],
  containerWidth: 300,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  gap: [10, 30], // [rowGap, columnGap]
} satisfies CssGridOptions
````

## File: testcases/level07.browser-result.json
````json
{
  "header": {
    "x": 0,
    "y": 0,
    "width": 300,
    "height": 50
  },
  "sidebar": {
    "x": 0,
    "y": 50,
    "width": 100,
    "height": 200
  },
  "content": {
    "x": 100,
    "y": 50,
    "width": 200,
    "height": 200
  },
  "footer": {
    "x": 0,
    "y": 250,
    "width": 300,
    "height": 50
  }
}
````

## File: testcases/level07.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Column and row spanning
export default {
  children: [
    { key: "header", columnSpan: 2 },
    { key: "sidebar" },
    { key: "content" },
    { key: "footer", columnSpan: 2 },
  ],
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 2fr",
  gridTemplateRows: "50px 1fr 50px",
} satisfies CssGridOptions
````

## File: testcases/level08.browser-result.json
````json
{
  "a": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "b": {
    "x": 200,
    "y": 100,
    "width": 100,
    "height": 100
  },
  "c": {
    "x": 100,
    "y": 200,
    "width": 100,
    "height": 100
  },
  "d": {
    "x": 200,
    "y": 0,
    "width": 100,
    "height": 100
  }
}
````

## File: testcases/level08.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Explicit row and column positioning
export default {
  children: [
    { key: "a", row: 1, column: 1 },
    { key: "b", row: 2, column: 3 },
    { key: "c", row: 3, column: 2 },
    { key: "d", row: 1, column: 3 },
  ],
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr",
} satisfies CssGridOptions
````

## File: testcases/level09.browser-result.json
````json
{
  "big": {
    "x": 0,
    "y": 0,
    "width": 200,
    "height": 200
  },
  "small1": {
    "x": 200,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "small2": {
    "x": 200,
    "y": 100,
    "width": 100,
    "height": 100
  },
  "bottom": {
    "x": 0,
    "y": 200,
    "width": 300,
    "height": 100
  }
}
````

## File: testcases/level09.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: rowEnd and columnEnd positioning
export default {
  children: [
    { key: "big", rowStart: 1, rowEnd: 3, columnStart: 1, columnEnd: 3 },
    { key: "small1", rowStart: 1, columnStart: 3 },
    { key: "small2", rowStart: 2, columnStart: 3 },
    { key: "bottom", rowStart: 3, columnStart: 1, columnEnd: 4 },
  ],
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr",
} satisfies CssGridOptions
````

## File: testcases/level10.browser-result.json
````json
{
  "first": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "second": {
    "x": 100,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "third": {
    "x": 200,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "fourth": {
    "x": 300,
    "y": 0,
    "width": 100,
    "height": 100
  }
}
````

## File: testcases/level10.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Order property
export default {
  children: [
    { key: "first", order: 3 },
    { key: "second", order: 1 },
    { key: "third", order: 2 },
    { key: "fourth" }, // no order, should be 0
  ],
  containerWidth: 400,
  containerHeight: 100,
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr",
} satisfies CssGridOptions
````

## File: testcases/level11.browser-result.json
````json
{
  "center-item": {
    "x": 35,
    "y": 37.5,
    "width": 30,
    "height": 25
  },
  "another-item": {
    "x": 135,
    "y": 37.5,
    "width": 30,
    "height": 25
  }
}
````

## File: testcases/level11.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Alignment - justifyItems and alignItems
export default {
  children: [
    { key: "center-item", contentWidth: 30, contentHeight: 25 },
    { key: "another-item", contentWidth: 30, contentHeight: 25 },
  ],
  containerWidth: 200,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  justifyItems: "center",
  alignItems: "center",
} satisfies CssGridOptions
````

## File: testcases/level12.browser-result.json
````json
{
  "auto-width": {
    "x": 0,
    "y": 0,
    "width": 50,
    "height": 100
  },
  "fixed-width": {
    "x": 50,
    "y": 0,
    "width": 100,
    "height": 100
  },
  "flexible": {
    "x": 150,
    "y": 0,
    "width": 150,
    "height": 100
  }
}
````

## File: testcases/level12.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Auto-sizing with auto keyword
export default {
  children: [
    { key: "auto-width" },
    { key: "fixed-width" },
    { key: "flexible" },
  ],
  containerWidth: 300,
  containerHeight: 100,
  gridTemplateColumns: "auto 100px 1fr",
  gridTemplateRows: "auto",
} satisfies CssGridOptions
````

## File: testcases/level13.browser-result.json
````json
{
  "sidebar": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 300
  },
  "main": {
    "x": 100,
    "y": 0,
    "width": 220,
    "height": 300
  },
  "ads": {
    "x": 320,
    "y": 0,
    "width": 80,
    "height": 300
  }
}
````

## File: testcases/level13.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Mixed units - percentages, pixels, and fr
export default {
  children: [{ key: "sidebar" }, { key: "main" }, { key: "ads" }],
  containerWidth: 400,
  containerHeight: 300,
  gridTemplateColumns: "25% 1fr 80px",
  gridTemplateRows: "100%",
} satisfies CssGridOptions
````

## File: testcases/level14.browser-result.json
````json
{
  "background": {
    "x": 0,
    "y": 0,
    "width": 300,
    "height": 300
  },
  "overlay1": {
    "x": 0,
    "y": 0,
    "width": 200,
    "height": 200
  },
  "overlay2": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 200
  },
  "corner": {
    "x": 200,
    "y": 200,
    "width": 100,
    "height": 100
  }
}
````

## File: testcases/level14.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Complex layout with overlapping items
export default {
  children: [
    { key: "background", rowStart: 1, rowEnd: 4, columnStart: 1, columnEnd: 4 },
    { key: "overlay1", rowStart: 1, columnStart: 1, rowSpan: 2, columnSpan: 2 },
    { key: "overlay2", rowStart: 2, columnStart: 2, rowSpan: 2, columnSpan: 2 },
    { key: "corner", rowStart: 3, columnStart: 3 },
  ],
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr 1fr",
} satisfies CssGridOptions
````

## File: testcases/level15.browser-result.json
````json
{
  "start-item": {
    "x": 0,
    "y": 70,
    "width": 50,
    "height": 30
  },
  "end-item": {
    "x": 200,
    "y": 80,
    "width": 30,
    "height": 20
  },
  "center-item": {
    "x": 0,
    "y": 188,
    "width": 40,
    "height": 12
  },
  "stretch-item": {
    "x": 200,
    "y": 160,
    "width": 24,
    "height": 40
  }
}
````

## File: testcases/level15.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Different alignment values
export default {
  children: [
    { key: "start-item", contentWidth: 50, contentHeight: 30 },
    { key: "end-item", contentWidth: 30, contentHeight: 20 },
    { key: "center-item", contentWidth: 40, contentHeight: 12 },
    { key: "stretch-item", contentWidth: 24, contentHeight: 40 },
  ],
  containerWidth: 400,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  justifyItems: "start",
  alignItems: "end",
} satisfies CssGridOptions
````

## File: testcases/level16.browser-result.json
````json
{
  "header": {
    "x": 0,
    "y": 0,
    "width": 300,
    "height": 50
  },
  "sidebar": {
    "x": 0,
    "y": 50,
    "width": 100,
    "height": 193
  },
  "content": {
    "x": 100,
    "y": 50,
    "width": 200,
    "height": 243
  },
  "footer": {
    "x": 0,
    "y": 293,
    "width": 300,
    "height": 7
  }
}
````

## File: testcases/level16.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Column and row spanning
export default {
  children: [
    { key: "header", columnSpan: 2 },
    { key: "sidebar" },
    { key: "content", rowSpan: 2 },
    { key: "footer", columnSpan: 2 },
  ],
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 2fr",
  gridTemplateRows: "50px 1fr 50px",
} satisfies CssGridOptions
````

## File: testcases/level17.browser-result.json
````json
{
  "item1": {
    "x": 0,
    "y": 0,
    "width": 50,
    "height": 40
  },
  "item2": {
    "x": 60,
    "y": 0,
    "width": 80,
    "height": 40
  },
  "item3": {
    "x": 150,
    "y": 0,
    "width": 100,
    "height": 40
  }
}
````

## File: testcases/level17.ts
````typescript
import type { CssGridOptions } from "lib/types"

// Test: Auto-sizing without container dimensions
export default {
  children: [
    { key: "item1", contentWidth: 50, contentHeight: 30 },
    { key: "item2", contentWidth: 80, contentHeight: 40 },
    { key: "item3", contentWidth: 60, contentHeight: 25 },
  ],
  // No containerWidth or containerHeight specified
  gridTemplateColumns: "1fr auto 100px",
  gridTemplateRows: "auto 1fr",
  gap: 10,
} satisfies CssGridOptions
````

## File: tests/__snapshots__/level01.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555554 288.8888888888889,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="288.8888888888889,188.55555555555554 288.8888888888889,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="288.8888888888889,437.44444444444446 40,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,437.44444444444446 40,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="125,0 225,0" data-type="line" data-label="" points="351.11111111111114,188.55555555555554 600,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="225,0 225,100" data-type="line" data-label="" points="600,188.55555555555554 600,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="225,100 125,100" data-type="line" data-label="" points="600,437.44444444444446 351.11111111111114,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="125,100 125,0" data-type="line" data-label="" points="351.11111111111114,437.44444444444446 351.11111111111114,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="water" data-x="50" data-y="10" x="139.55555555555554" y="188.55555555555554" width="49.7777777777778" height="49.77777777777777" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="0.4017857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="water" data-x="175" data-y="10" x="450.6666666666667" y="188.55555555555554" width="49.77777777777777" height="49.77777777777777" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="0.4017857142857143" />
  </g><text data-type="text" data-label="algo" data-x="50" data-y="105.625" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="175" data-y="105.625" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 2.488888888888889,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 2.488888888888889,
        "f": 188.55555555555554
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level02.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555554 288.8888888888889,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="288.8888888888889,188.55555555555554 288.8888888888889,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="288.8888888888889,437.44444444444446 40,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,437.44444444444446 40,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="125,0 225,0" data-type="line" data-label="" points="351.11111111111114,188.55555555555554 600,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="225,0 225,100" data-type="line" data-label="" points="600,188.55555555555554 600,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="225,100 125,100" data-type="line" data-label="" points="600,437.44444444444446 351.11111111111114,437.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="125,100 125,0" data-type="line" data-label="" points="351.11111111111114,437.44444444444446 351.11111111111114,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="water" data-x="10" data-y="50" x="40" y="288.1111111111111" width="49.77777777777777" height="49.77777777777783" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="0.4017857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="water" data-x="135" data-y="50" x="351.11111111111114" y="288.1111111111111" width="49.77777777777777" height="49.77777777777783" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="0.4017857142857143" />
  </g><text data-type="text" data-label="algo" data-x="50" data-y="105.625" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="175" data-y="105.625" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 2.488888888888889,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 2.488888888888889,
        "f": 188.55555555555554
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level03.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555554 164.44444444444446,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="164.44444444444446,188.55555555555554 164.44444444444446,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="164.44444444444446,313 164.44444444444446,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,313 40,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="250,0 350,0" data-type="line" data-label="" points="351.11111111111114,188.55555555555554 475.55555555555554,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="350,0 350,100" data-type="line" data-label="" points="475.55555555555554,188.55555555555554 475.55555555555554,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="350,100 250,100" data-type="line" data-label="" points="475.55555555555554,313 351.11111111111114,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="250,100 250,0" data-type="line" data-label="" points="351.11111111111114,313 351.11111111111114,188.55555555555554" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="item1" data-x="50" data-y="50" x="40" y="188.55555555555554" width="124.44444444444446" height="124.44444444444446" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item2" data-x="150" data-y="50" x="164.44444444444446" y="188.55555555555554" width="124.44444444444446" height="124.44444444444446" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item3" data-x="50" data-y="150" x="40" y="313" width="124.44444444444446" height="124.44444444444446" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item4" data-x="150" data-y="150" x="164.44444444444446" y="313" width="124.44444444444446" height="124.44444444444446" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item1" data-x="300" data-y="50" x="351.11111111111114" y="188.55555555555554" width="124.4444444444444" height="124.44444444444446" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item2" data-x="400" data-y="50" x="475.55555555555554" y="188.55555555555554" width="124.44444444444446" height="124.44444444444446" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item3" data-x="300" data-y="150" x="351.11111111111114" y="313" width="124.4444444444444" height="124.44444444444446" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="item4" data-x="400" data-y="150" x="475.55555555555554" y="313" width="124.44444444444446" height="124.44444444444446" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.8035714285714286" />
  </g><text data-type="text" data-label="algo" data-x="100" data-y="211.25" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="350" data-y="211.25" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 1.2444444444444445,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 1.2444444444444445,
        "f": 188.55555555555554
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level04.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,242.48148148148147 122.96296296296296,242.48148148148147" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,242.48148148148147 122.96296296296296,325.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="122.96296296296296,325.44444444444446 122.96296296296296,242.48148148148147" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,325.44444444444446 40,242.48148148148147" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,242.48148148148147 434.0740740740741,242.48148148148147" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,242.48148148148147 434.0740740740741,325.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,325.44444444444446 351.1111111111111,325.44444444444446" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,325.44444444444446 351.1111111111111,242.48148148148147" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="50" data-y="25" x="40" y="242.48148148148147" width="82.96296296296296" height="41.48148148148147" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="200" data-y="25" x="122.96296296296296" y="242.48148148148147" width="165.92592592592595" height="41.48148148148147" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="50" data-y="110" x="40" y="283.96296296296293" width="82.96296296296296" height="99.55555555555554" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="200" data-y="110" x="122.96296296296296" y="283.96296296296293" width="165.92592592592595" height="99.55555555555554" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="425" data-y="25" x="351.1111111111111" y="242.48148148148147" width="82.96296296296299" height="41.48148148148147" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="575" data-y="25" x="434.0740740740741" y="242.48148148148147" width="165.92592592592592" height="41.48148148148147" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="425" data-y="110" x="351.1111111111111" y="283.96296296296293" width="82.96296296296299" height="99.55555555555554" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="575" data-y="110" x="434.0740740740741" y="283.96296296296293" width="165.92592592592592" height="99.55555555555554" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="186.875" x="164.44444444444446" y="397.5185185185185" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="186.875" x="475.55555555555554" y="397.5185185185185" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 242.48148148148147
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level05.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 143.7037037037037,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="143.7037037037037,188.55555555555557 143.7037037037037,292.25925925925924" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="143.7037037037037,292.25925925925924 40,292.25925925925924" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,292.25925925925924 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="300,0 400,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 454.8148148148148,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="400,0 400,100" data-type="line" data-label="" points="454.8148148148148,188.55555555555557 454.8148148148148,292.25925925925924" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="400,100 300,100" data-type="line" data-label="" points="454.8148148148148,292.25925925925924 351.1111111111111,292.25925925925924" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="300,100 300,0" data-type="line" data-label="" points="351.1111111111111,292.25925925925924 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="box1" data-x="55" data-y="55" x="40" y="188.55555555555557" width="114.07407407407408" height="114.07407407407405" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box2" data-x="185" data-y="55" x="174.8148148148148" y="188.55555555555557" width="114.0740740740741" height="114.07407407407405" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box3" data-x="55" data-y="185" x="40" y="323.3703703703704" width="114.07407407407408" height="114.07407407407408" fill="hsl(291.42857142857144deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box4" data-x="185" data-y="185" x="174.8148148148148" y="323.3703703703704" width="114.0740740740741" height="114.07407407407408" fill="hsl(308.57142857142856deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box1" data-x="355" data-y="55" x="351.1111111111111" y="188.55555555555557" width="114.07407407407408" height="114.07407407407405" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box2" data-x="485" data-y="55" x="485.9259259259259" y="188.55555555555557" width="114.07407407407408" height="114.07407407407405" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box3" data-x="355" data-y="185" x="351.1111111111111" y="323.3703703703704" width="114.07407407407408" height="114.07407407407408" fill="hsl(291.42857142857144deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g>
  <g>
    <rect data-type="rect" data-label="box4" data-x="485" data-y="185" x="485.9259259259259" y="323.3703703703704" width="114.07407407407408" height="114.07407407407408" fill="hsl(308.57142857142856deg, 100%, 50%)" stroke="black" stroke-width="0.9642857142857143" />
  </g><text data-type="text" data-label="algo" data-x="120" data-y="253.5" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="420" data-y="253.5" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 1.037037037037037,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 1.037037037037037,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level06.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,230.03703703703704 122.96296296296296,230.03703703703704" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,230.03703703703704 122.96296296296296,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="122.96296296296296,313 40,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,313 40,230.03703703703704" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,230.03703703703704 434.0740740740741,230.03703703703704" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,230.03703703703704 434.0740740740741,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,313 351.1111111111111,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,313 351.1111111111111,230.03703703703704" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="a" data-x="40" data-y="47.5" x="40" y="230.03703703703704" width="66.37037037037037" height="78.81481481481481" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="b" data-x="150" data-y="47.5" x="131.25925925925924" y="230.03703703703704" width="66.37037037037038" height="78.81481481481481" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="c" data-x="260" data-y="47.5" x="222.5185185185185" y="230.03703703703704" width="66.37037037037041" height="78.81481481481481" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="d" data-x="40" data-y="152.5" x="40" y="317.14814814814815" width="66.37037037037037" height="78.81481481481478" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="e" data-x="150" data-y="152.5" x="131.25925925925924" y="317.14814814814815" width="66.37037037037038" height="78.81481481481478" fill="hsl(291.42857142857144deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="f" data-x="260" data-y="152.5" x="222.5185185185185" y="317.14814814814815" width="66.37037037037041" height="78.81481481481478" fill="hsl(308.57142857142856deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="a" data-x="415" data-y="47.5" x="351.1111111111111" y="230.03703703703704" width="66.37037037037038" height="78.81481481481481" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="b" data-x="525" data-y="47.5" x="442.3703703703704" y="230.03703703703704" width="66.37037037037032" height="78.81481481481481" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="c" data-x="635" data-y="47.5" x="533.6296296296296" y="230.03703703703704" width="66.37037037037044" height="78.81481481481481" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="d" data-x="415" data-y="152.5" x="351.1111111111111" y="317.14814814814815" width="66.37037037037038" height="78.81481481481478" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="e" data-x="525" data-y="152.5" x="442.3703703703704" y="317.14814814814815" width="66.37037037037032" height="78.81481481481478" fill="hsl(291.42857142857144deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="f" data-x="635" data-y="152.5" x="533.6296296296296" y="317.14814814814815" width="66.37037037037044" height="78.81481481481478" fill="hsl(308.57142857142856deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="216.875" x="164.44444444444446" y="409.96296296296293" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="216.875" x="475.55555555555554" y="409.96296296296293" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 230.03703703703704
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level07.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,188.55555555555557 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,271.51851851851853 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 434.0740740740741,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,188.55555555555557 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="150" data-y="25" x="40" y="188.55555555555557" width="248.8888888888889" height="41.481481481481495" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="50" data-y="150" x="40" y="230.03703703703707" width="82.96296296296296" height="165.92592592592587" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="200" data-y="150" x="122.96296296296296" y="230.03703703703707" width="165.92592592592595" height="165.92592592592587" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="150" data-y="275" x="40" y="395.96296296296293" width="248.8888888888889" height="41.481481481481524" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="525" data-y="25" x="351.1111111111111" y="188.55555555555557" width="248.8888888888889" height="41.481481481481495" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="425" data-y="150" x="351.1111111111111" y="230.03703703703707" width="82.96296296296299" height="165.92592592592587" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="575" data-y="150" x="434.0740740740741" y="230.03703703703707" width="165.92592592592592" height="165.92592592592587" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="525" data-y="275" x="351.1111111111111" y="395.96296296296293" width="248.8888888888889" height="41.481481481481524" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="316.875" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="316.875" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level08.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,188.55555555555557 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,271.51851851851853 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 434.0740740740741,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,188.55555555555557 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="a" data-x="50" data-y="50" x="40" y="188.55555555555557" width="82.96296296296296" height="82.96296296296296" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="b" data-x="250" data-y="150" x="205.92592592592592" y="271.51851851851853" width="82.96296296296299" height="82.96296296296299" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="c" data-x="150" data-y="250" x="122.96296296296296" y="354.4814814814815" width="82.96296296296296" height="82.96296296296293" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="d" data-x="250" data-y="50" x="205.92592592592592" y="188.55555555555557" width="82.96296296296299" height="82.96296296296296" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="a" data-x="425" data-y="50" x="351.1111111111111" y="188.55555555555557" width="82.96296296296299" height="82.96296296296296" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="b" data-x="625" data-y="150" x="517.037037037037" y="271.51851851851853" width="82.96296296296305" height="82.96296296296299" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="c" data-x="525" data-y="250" x="434.0740740740741" y="354.4814814814815" width="82.96296296296288" height="82.96296296296293" fill="hsl(257.14285714285717deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="d" data-x="625" data-y="50" x="517.037037037037" y="188.55555555555557" width="82.96296296296305" height="82.96296296296296" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="316.875" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="316.875" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level09.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,188.55555555555557 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,271.51851851851853 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 434.0740740740741,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,188.55555555555557 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="big" data-x="100" data-y="100" x="40" y="188.55555555555557" width="165.92592592592592" height="165.92592592592595" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="small1" data-x="250" data-y="50" x="205.92592592592592" y="188.55555555555557" width="82.96296296296299" height="82.96296296296296" fill="hsl(102.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="small2" data-x="250" data-y="150" x="205.92592592592592" y="271.51851851851853" width="82.96296296296299" height="82.96296296296299" fill="hsl(85.71428571428571deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="bottom" data-x="150" data-y="250" x="40" y="354.4814814814815" width="248.8888888888889" height="82.96296296296293" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="big" data-x="475" data-y="100" x="351.1111111111111" y="188.55555555555557" width="165.92592592592587" height="165.92592592592595" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="small1" data-x="625" data-y="50" x="517.037037037037" y="188.55555555555557" width="82.96296296296305" height="82.96296296296296" fill="hsl(102.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="small2" data-x="625" data-y="150" x="517.037037037037" y="271.51851851851853" width="82.96296296296305" height="82.96296296296299" fill="hsl(85.71428571428571deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="bottom" data-x="525" data-y="250" x="351.1111111111111" y="354.4814814814815" width="248.8888888888889" height="82.96296296296293" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="316.875" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="316.875" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level10.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,281.8888888888889 102.22222222222223,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="102.22222222222223,281.8888888888889 102.22222222222223,344.11111111111114" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="102.22222222222223,344.11111111111114 40,344.11111111111114" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,344.11111111111114 40,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="500,0 600,0" data-type="line" data-label="" points="351.11111111111114,281.8888888888889 413.3333333333333,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="600,0 600,100" data-type="line" data-label="" points="413.3333333333333,281.8888888888889 413.3333333333333,344.11111111111114" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="600,100 500,100" data-type="line" data-label="" points="413.3333333333333,344.11111111111114 351.11111111111114,344.11111111111114" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="500,100 500,0" data-type="line" data-label="" points="351.11111111111114,344.11111111111114 351.11111111111114,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="first" data-x="50" data-y="50" x="40" y="281.8888888888889" width="62.22222222222223" height="62.22222222222223" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="second" data-x="150" data-y="50" x="102.22222222222223" y="281.8888888888889" width="62.22222222222223" height="62.22222222222223" fill="hsl(325.7142857142857deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="third" data-x="250" data-y="50" x="164.44444444444446" y="281.8888888888889" width="62.2222222222222" height="62.22222222222223" fill="hsl(188.57142857142858deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="fourth" data-x="350" data-y="50" x="226.66666666666666" y="281.8888888888889" width="62.22222222222226" height="62.22222222222223" fill="hsl(102.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="first" data-x="550" data-y="50" x="351.11111111111114" y="281.8888888888889" width="62.22222222222217" height="62.22222222222223" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="second" data-x="650" data-y="50" x="413.3333333333333" y="281.8888888888889" width="62.22222222222223" height="62.22222222222223" fill="hsl(325.7142857142857deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="third" data-x="750" data-y="50" x="475.55555555555554" y="281.8888888888889" width="62.222222222222285" height="62.22222222222223" fill="hsl(188.57142857142858deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="fourth" data-x="850" data-y="50" x="537.7777777777778" y="281.8888888888889" width="62.22222222222217" height="62.22222222222223" fill="hsl(102.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g><text data-type="text" data-label="algo" data-x="200" data-y="122.5" x="164.44444444444446" y="358.11111111111114" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="700" data-y="122.5" x="475.55555555555554" y="358.11111111111114" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.6222222222222222,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.6222222222222222,
        "f": 281.8888888888889
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level11.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,237.5791245791246 190.84175084175084,237.5791245791246" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="190.84175084175084,237.5791245791246 190.84175084175084,388.4208754208754" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="190.84175084175084,388.4208754208754 40,388.4208754208754" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,388.4208754208754 40,237.5791245791246" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="206.25,0 306.25,0" data-type="line" data-label="" points="351.11111111111114,237.5791245791246 501.95286195286195,237.5791245791246" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="306.25,0 306.25,100" data-type="line" data-label="" points="501.95286195286195,237.5791245791246 501.95286195286195,388.4208754208754" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="306.25,100 206.25,100" data-type="line" data-label="" points="501.95286195286195,388.4208754208754 351.11111111111114,388.4208754208754" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="206.25,100 206.25,0" data-type="line" data-label="" points="351.11111111111114,388.4208754208754 351.11111111111114,237.5791245791246" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="center-item" data-x="50" data-y="50" x="92.79461279461279" y="294.1447811447812" width="45.25252525252526" height="37.7104377104377" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="0.6629464285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="another-item" data-x="150" data-y="50" x="243.63636363636363" y="294.1447811447812" width="45.25252525252529" height="37.7104377104377" fill="hsl(120deg, 100%, 50%)" stroke="black" stroke-width="0.6629464285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="center-item" data-x="256.25" data-y="50" x="403.9057239057239" y="294.1447811447812" width="45.25252525252529" height="37.7104377104377" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="0.6629464285714286" />
  </g>
  <g>
    <rect data-type="rect" data-label="another-item" data-x="356.25" data-y="50" x="554.7474747474747" y="294.1447811447812" width="45.25252525252529" height="37.7104377104377" fill="hsl(120deg, 100%, 50%)" stroke="black" stroke-width="0.6629464285714286" />
  </g><text data-type="text" data-label="algo" data-x="82.5" data-y="109.28125" x="164.44444444444446" y="402.4208754208754" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="288.75" data-y="109.28125" x="475.55555555555554" y="402.4208754208754" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 1.5084175084175084,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 1.5084175084175084,
        "f": 237.5791245791246
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level12.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,271.51851851851853 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 122.96296296296296,354.4814814814815" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="122.96296296296296,354.4814814814815 40,354.4814814814815" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,354.4814814814815 40,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 434.0740740740741,354.4814814814815" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,354.4814814814815 351.1111111111111,354.4814814814815" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,354.4814814814815 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="auto-width" data-x="50" data-y="50" x="40" y="271.51851851851853" width="82.96296296296296" height="82.96296296296299" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="fixed-width" data-x="150" data-y="50" x="122.96296296296296" y="271.51851851851853" width="82.96296296296296" height="82.96296296296299" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="flexible" data-x="250" data-y="50" x="205.92592592592592" y="271.51851851851853" width="82.96296296296299" height="82.96296296296299" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="auto-width" data-x="400" data-y="50" x="351.1111111111111" y="271.51851851851853" width="41.481481481481524" height="82.96296296296299" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="fixed-width" data-x="475" data-y="50" x="392.5925925925926" y="271.51851851851853" width="82.96296296296293" height="82.96296296296299" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="flexible" data-x="600" data-y="50" x="475.55555555555554" y="271.51851851851853" width="124.44444444444446" height="82.96296296296299" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="116.875" x="164.44444444444446" y="368.4814814814815" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="116.875" x="475.55555555555554" y="368.4814814814815" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 271.51851851851853
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level13.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,219.66666666666669 102.22222222222223,219.66666666666669" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="102.22222222222223,219.66666666666669 102.22222222222223,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="102.22222222222223,281.8888888888889 102.22222222222223,219.66666666666669" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,281.8888888888889 40,219.66666666666669" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="500,0 600,0" data-type="line" data-label="" points="351.11111111111114,219.66666666666669 413.3333333333333,219.66666666666669" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="600,0 600,100" data-type="line" data-label="" points="413.3333333333333,219.66666666666669 413.3333333333333,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="600,100 500,100" data-type="line" data-label="" points="413.3333333333333,281.8888888888889 351.11111111111114,281.8888888888889" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="500,100 500,0" data-type="line" data-label="" points="351.11111111111114,281.8888888888889 351.11111111111114,219.66666666666669" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="50" data-y="150" x="40" y="219.66666666666669" width="62.22222222222223" height="186.66666666666669" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="main" data-x="210" data-y="150" x="102.22222222222223" y="219.66666666666669" width="136.88888888888889" height="186.66666666666669" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="ads" data-x="360" data-y="150" x="239.11111111111111" y="219.66666666666669" width="49.7777777777778" height="186.66666666666669" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="550" data-y="150" x="351.11111111111114" y="219.66666666666669" width="62.22222222222217" height="186.66666666666669" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="main" data-x="710" data-y="150" x="413.3333333333333" y="219.66666666666669" width="136.88888888888886" height="186.66666666666669" fill="hsl(222.85714285714286deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g>
  <g>
    <rect data-type="rect" data-label="ads" data-x="860" data-y="150" x="550.2222222222222" y="219.66666666666669" width="49.77777777777783" height="186.66666666666669" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="1.6071428571428572" />
  </g><text data-type="text" data-label="algo" data-x="200" data-y="322.5" x="164.44444444444446" y="420.33333333333337" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="700" data-y="322.5" x="475.55555555555554" y="420.33333333333337" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.6222222222222222,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.6222222222222222,
        "f": 219.66666666666669
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level14.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,188.55555555555557 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 100,0" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,271.51851851851853 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 434.0740740740741,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,188.55555555555557 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="background" data-x="150" data-y="150" x="40" y="188.55555555555557" width="248.8888888888889" height="248.88888888888889" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="overlay1" data-x="100" data-y="100" x="40" y="188.55555555555557" width="165.92592592592592" height="165.92592592592595" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="overlay2" data-x="200" data-y="200" x="122.96296296296296" y="271.51851851851853" width="165.92592592592595" height="165.92592592592592" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="corner" data-x="250" data-y="250" x="205.92592592592592" y="354.4814814814815" width="82.96296296296299" height="82.96296296296293" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="background" data-x="525" data-y="150" x="351.1111111111111" y="188.55555555555557" width="248.8888888888889" height="248.88888888888889" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="overlay1" data-x="475" data-y="100" x="351.1111111111111" y="188.55555555555557" width="165.92592592592587" height="165.92592592592595" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="overlay2" data-x="575" data-y="200" x="434.0740740740741" y="271.51851851851853" width="165.92592592592592" height="165.92592592592592" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="corner" data-x="625" data-y="250" x="517.037037037037" y="354.4814814814815" width="82.96296296296305" height="82.96296296296293" fill="hsl(205.71428571428572deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="316.875" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="316.875" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level15.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,204.78743961352657 148.21256038647343,204.78743961352657" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="148.21256038647343,204.78743961352657 148.21256038647343,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="148.21256038647343,313 40,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,313 40,204.78743961352657" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="287.5,0 387.5,0" data-type="line" data-label="" points="351.1111111111111,204.78743961352657 459.3236714975845,204.78743961352657" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="387.5,0 387.5,100" data-type="line" data-label="" points="459.3236714975845,204.78743961352657 459.3236714975845,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="387.5,100 287.5,100" data-type="line" data-label="" points="459.3236714975845,313 351.1111111111111,313" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="287.5,100 287.5,0" data-type="line" data-label="" points="351.1111111111111,313 351.1111111111111,204.78743961352657" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="start-item" data-x="25" data-y="85" x="40" y="280.536231884058" width="54.106280193236714" height="32.463768115942" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="end-item" data-x="215" data-y="90" x="256.42512077294685" y="291.35748792270533" width="32.463768115942" height="21.64251207729467" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="center-item" data-x="20" data-y="194" x="40" y="408.2270531400966" width="43.285024154589365" height="12.98550724637687" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="stretch-item" data-x="212" data-y="180" x="256.42512077294685" y="377.927536231884" width="25.971014492753625" height="43.28502415458945" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="start-item" data-x="312.5" data-y="85" x="351.1111111111111" y="280.536231884058" width="54.10628019323673" height="32.463768115942" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="end-item" data-x="502.5" data-y="90" x="567.5362318840579" y="291.35748792270533" width="32.463768115942116" height="21.64251207729467" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="center-item" data-x="307.5" data-y="194" x="351.1111111111111" y="408.2270531400966" width="43.285024154589394" height="12.98550724637687" fill="hsl(240deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g>
  <g>
    <rect data-type="rect" data-label="stretch-item" data-x="499.5" data-y="180" x="567.5362318840579" y="377.927536231884" width="25.971014492753625" height="43.28502415458945" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="0.9241071428571429" />
  </g><text data-type="text" data-label="algo" data-x="115" data-y="212.9375" x="164.44444444444443" y="435.21256038647346" fill="black" font-size="13.999999999999998" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="402.5" data-y="212.9375" x="475.55555555555554" y="435.21256038647346" fill="black" font-size="13.999999999999998" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 1.0821256038647342,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 1.0821256038647342,
        "f": 204.78743961352657
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level16.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,188.55555555555557 122.96296296296296,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="122.96296296296296,188.55555555555557 122.96296296296296,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="122.96296296296296,271.51851851851853 40,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,271.51851851851853 40,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,0 475,0" data-type="line" data-label="" points="351.1111111111111,188.55555555555557 434.0740740740741,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,0 475,100" data-type="line" data-label="" points="434.0740740740741,188.55555555555557 434.0740740740741,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="475,100 375,100" data-type="line" data-label="" points="434.0740740740741,271.51851851851853 351.1111111111111,271.51851851851853" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="375,100 375,0" data-type="line" data-label="" points="351.1111111111111,271.51851851851853 351.1111111111111,188.55555555555557" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="150" data-y="25" x="40" y="188.55555555555557" width="248.8888888888889" height="41.481481481481495" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="50" data-y="150" x="40" y="230.03703703703707" width="82.96296296296296" height="165.92592592592587" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="200" data-y="175" x="122.96296296296296" y="230.03703703703707" width="165.92592592592595" height="207.4074074074074" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="150" data-y="275" x="40" y="395.96296296296293" width="248.8888888888889" height="41.481481481481524" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="header" data-x="525" data-y="25" x="351.1111111111111" y="188.55555555555557" width="248.8888888888889" height="41.481481481481495" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="sidebar" data-x="425" data-y="146.5" x="351.1111111111111" y="230.03703703703707" width="82.96296296296299" height="160.1185185185185" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="content" data-x="575" data-y="171.5" x="434.0740740740741" y="230.03703703703707" width="165.92592592592592" height="201.59999999999997" fill="hsl(274.2857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g>
  <g>
    <rect data-type="rect" data-label="footer" data-x="525" data-y="296.5" x="351.1111111111111" y="431.63703703703703" width="248.8888888888889" height="5.807407407407425" fill="hsl(51.42857142857143deg, 100%, 50%)" stroke="black" stroke-width="1.2053571428571428" />
  </g><text data-type="text" data-label="algo" data-x="150" data-y="316.875" x="164.44444444444446" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="525" data-y="316.875" x="475.55555555555554" y="451.44444444444446" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.8296296296296296,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.8296296296296296,
        "f": 188.55555555555557
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/__snapshots__/level17.snap.svg
````
<svg width="640" height="640" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  <g>
    <polyline data-points="0,0 100,0" data-type="line" data-label="" points="40,263.22222222222223 139.55555555555554,263.22222222222223" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,0 100,100" data-type="line" data-label="" points="139.55555555555554,263.22222222222223 139.55555555555554,362.77777777777777" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="100,100 0,100" data-type="line" data-label="" points="139.55555555555554,362.77777777777777 40,362.77777777777777" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="0,100 0,0" data-type="line" data-label="" points="40,362.77777777777777 40,263.22222222222223" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="312.5,0 412.5,0" data-type="line" data-label="" points="351.1111111111111,263.22222222222223 450.66666666666663,263.22222222222223" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="412.5,0 412.5,100" data-type="line" data-label="" points="450.66666666666663,263.22222222222223 450.66666666666663,362.77777777777777" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="412.5,100 312.5,100" data-type="line" data-label="" points="450.66666666666663,362.77777777777777 351.1111111111111,362.77777777777777" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <polyline data-points="312.5,100 312.5,0" data-type="line" data-label="" points="351.1111111111111,362.77777777777777 351.1111111111111,263.22222222222223" fill="none" stroke="black" stroke-width="1" />
  </g>
  <g>
    <rect data-type="rect" data-label="item1" data-x="25" data-y="20" x="40" y="263.22222222222223" width="49.77777777777777" height="39.82222222222225" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g>
  <g>
    <rect data-type="rect" data-label="item2" data-x="100" data-y="20" x="99.73333333333333" y="263.22222222222223" width="79.64444444444443" height="39.82222222222225" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g>
  <g>
    <rect data-type="rect" data-label="item3" data-x="200" data-y="20" x="189.33333333333334" y="263.22222222222223" width="99.55555555555557" height="39.82222222222225" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g>
  <g>
    <rect data-type="rect" data-label="item1" data-x="337.5" data-y="20" x="351.1111111111111" y="263.22222222222223" width="49.77777777777777" height="39.82222222222225" fill="hsl(0deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g>
  <g>
    <rect data-type="rect" data-label="item2" data-x="412.5" data-y="20" x="410.84444444444443" y="263.22222222222223" width="79.64444444444445" height="39.82222222222225" fill="hsl(17.142857142857142deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g>
  <g>
    <rect data-type="rect" data-label="item3" data-x="512.5" data-y="20" x="500.44444444444446" y="263.22222222222223" width="99.55555555555554" height="39.82222222222225" fill="hsl(34.285714285714285deg, 100%, 50%)" stroke="black" stroke-width="1.0044642857142858" />
  </g><text data-type="text" data-label="algo" data-x="125" data-y="114.0625" x="164.44444444444446" y="376.77777777777777" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">algo</text><text data-type="text" data-label="correct" data-x="437.5" data-y="114.0625" x="475.55555555555554" y="376.77777777777777" fill="black" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="text-after-edge">correct</text>
  <g id="crosshair" style="display: none">
    <line id="crosshair-h" y1="0" y2="640" stroke="#666" stroke-width="0.5" />
    <line id="crosshair-v" x1="0" x2="640" stroke="#666" stroke-width="0.5" /><text id="coordinates" font-family="monospace" font-size="12" fill="#666"></text>
  </g>
  <script>
    <![CDATA[
    document.currentScript.parentElement.addEventListener('mousemove', (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const crosshair = svg.getElementById('crosshair');
      const h = svg.getElementById('crosshair-h');
      const v = svg.getElementById('crosshair-v');
      const coords = svg.getElementById('coordinates');

      crosshair.style.display = 'block';
      h.setAttribute('x1', '0');
      h.setAttribute('x2', '640');
      h.setAttribute('y1', y);
      h.setAttribute('y2', y);
      v.setAttribute('x1', x);
      v.setAttribute('x2', x);
      v.setAttribute('y1', '0');
      v.setAttribute('y2', '640');

      // Calculate real coordinates using inverse transformation
      const matrix = {
        "a": 0.9955555555555555,
        "c": 0,
        "e": 40,
        "b": 0,
        "d": 0.9955555555555555,
        "f": 263.22222222222223
      };
      // Manually invert and apply the affine transform
      // Since we only use translate and scale, we can directly compute:
      // x' = (x - tx) / sx
      // y' = (y - ty) / sy
      const sx = matrix.a;
      const sy = matrix.d;
      const tx = matrix.e;
      const ty = matrix.f;
      const realPoint = {
        x: (x - tx) / sx,
        y: (y - ty) / sy // Flip y back since we used negative scale
      }

      coords.textContent = `(${realPoint.x.toFixed(2)}, ${realPoint.y.toFixed(2)})`;
      coords.setAttribute('x', (x + 5).toString());
      coords.setAttribute('y', (y - 5).toString());
    });
    document.currentScript.parentElement.addEventListener('mouseleave', () => {
      document.currentScript.parentElement.getElementById('crosshair').style.display = 'none';
    });
    ]]>
  </script>
</svg>
````

## File: tests/fixtures/preload.ts
````typescript
import "bun-match-svg"
````

## File: tests/fixtures/testGrid.ts
````typescript
import {
  getSvgFromGraphicsObject,
  stackGraphicsHorizontally,
} from "graphics-debug"
import { CssGrid } from "lib/index"
import type { BrowserResult, CssGridOptions } from "lib/types"
import { visualizeBrowserResult } from "lib/visualizeBrowserResult"

export const testGrid = (
  input: CssGridOptions,
  browserResult: BrowserResult,
) => {
  const grid = new CssGrid(input)

  const browserResultGraphics = visualizeBrowserResult(browserResult)
  const browserResultSvg = getSvgFromGraphicsObject(browserResultGraphics, {
    backgroundColor: "white",
  })

  const layout = grid.layout()

  const algoOutputGraphics = grid.visualize()

  // Use the itemCoordinates directly from the layout
  const laidOutResult = layout.itemCoordinates

  algoOutputGraphics.lines?.push(
    {
      strokeColor: "black",
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    },
    {
      strokeColor: "black",
      points: [
        { x: 0, y: 100 },
        { x: 0, y: 0 },
      ],
    },
  )
  const outputVizSvg = getSvgFromGraphicsObject(
    stackGraphicsHorizontally([algoOutputGraphics, browserResultGraphics], {
      titles: ["algo", "correct"],
    }),
    {
      backgroundColor: "white",
    },
  )

  return {
    browserResultSvg,
    layout,
    laidOutResult,
    outputViz: outputVizSvg,
  }
}
````

## File: tests/level01.test.ts
````typescript
import { expect, test } from "bun:test"
import level1 from "testcases/level01"
import browserResult from "testcases/level01.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level01", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level1, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "water": {
        "height": 20,
        "width": 20,
        "x": 40,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "water": {
        "height": 20,
        "width": 20,
        "x": 40,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toEqual(browserResult)
  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 2,
          "columnSpan": 1,
          "height": 20,
          "key": "water",
          "row": 0,
          "rowSpan": 1,
          "width": 20,
          "x": 40,
          "y": 0,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        20,
        20,
        20,
        20,
        20,
      ],
      "itemCoordinates": {
        "water": {
          "height": 20,
          "width": 20,
          "x": 40,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        20,
        20,
        20,
        20,
        20,
      ],
    }
  `)

  expect(outputViz).toMatchSvgSnapshot(import.meta.path)
})
````

## File: tests/level02.test.ts
````typescript
import { expect, test } from "bun:test"
import level02 from "testcases/level02"
import browserResult from "testcases/level02.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level02", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level02, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "water": {
        "height": 20,
        "width": 20,
        "x": 0,
        "y": 40,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "water": {
        "height": 20,
        "width": 20,
        "x": 0,
        "y": 40,
      },
    }
  `)
  expect(laidOutResult).toEqual(browserResult)
  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 20,
          "key": "water",
          "row": 2,
          "rowSpan": 1,
          "width": 20,
          "x": 0,
          "y": 40,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        20,
        20,
        20,
        20,
        20,
      ],
      "itemCoordinates": {
        "water": {
          "height": 20,
          "width": 20,
          "x": 0,
          "y": 40,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        20,
        20,
        20,
        20,
        20,
      ],
    }
  `)

  expect(outputViz).toMatchSvgSnapshot(import.meta.path)
})
````

## File: tests/level03.test.ts
````typescript
import { expect, test } from "bun:test"
import level03 from "testcases/level03"
import browserResult from "testcases/level03.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level03", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level03, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "item1": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "item2": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 0,
      },
      "item3": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 100,
      },
      "item4": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 100,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "item1": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "item2": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 0,
      },
      "item3": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 100,
      },
      "item4": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 100,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 100,
          "key": "item1",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 100,
          "key": "item2",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 100,
          "key": "item3",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 100,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 100,
          "key": "item4",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 100,
          "y": 100,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
      ],
      "itemCoordinates": {
        "item1": {
          "height": 100,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        "item2": {
          "height": 100,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        "item3": {
          "height": 100,
          "width": 100,
          "x": 0,
          "y": 100,
        },
        "item4": {
          "height": 100,
          "width": 100,
          "x": 100,
          "y": 100,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level04.test.ts
````typescript
import { expect, test } from "bun:test"
import level04 from "testcases/level04"
import browserResult from "testcases/level04.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level04", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level04, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 120,
        "width": 100,
        "x": 0,
        "y": 50,
      },
      "footer": {
        "height": 120,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "header": {
        "height": 50,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 50,
        "width": 200,
        "x": 100,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 120,
        "width": 100,
        "x": 0,
        "y": 50,
      },
      "footer": {
        "height": 120,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "header": {
        "height": 50,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 50,
        "width": 200,
        "x": 100,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 50,
          "key": "header",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 50,
          "key": "sidebar",
          "row": 0,
          "rowSpan": 1,
          "width": 200,
          "x": 100,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 120,
          "key": "content",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 50,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 120,
          "key": "footer",
          "row": 1,
          "rowSpan": 1,
          "width": 200,
          "x": 100,
          "y": 50,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        200,
      ],
      "itemCoordinates": {
        "content": {
          "height": 120,
          "width": 100,
          "x": 0,
          "y": 50,
        },
        "footer": {
          "height": 120,
          "width": 200,
          "x": 100,
          "y": 50,
        },
        "header": {
          "height": 50,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        "sidebar": {
          "height": 50,
          "width": 200,
          "x": 100,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        50,
        120,
        30,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level05.test.ts
````typescript
import { expect, test } from "bun:test"
import level05 from "testcases/level05"
import browserResult from "testcases/level05.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level05", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level05, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "box1": {
        "height": 110,
        "width": 110,
        "x": 0,
        "y": 0,
      },
      "box2": {
        "height": 110,
        "width": 110,
        "x": 130,
        "y": 0,
      },
      "box3": {
        "height": 110,
        "width": 110,
        "x": 0,
        "y": 130,
      },
      "box4": {
        "height": 110,
        "width": 110,
        "x": 130,
        "y": 130,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "box1": {
        "height": 110,
        "width": 110,
        "x": 0,
        "y": 0,
      },
      "box2": {
        "height": 110,
        "width": 110,
        "x": 130,
        "y": 0,
      },
      "box3": {
        "height": 110,
        "width": 110,
        "x": 0,
        "y": 130,
      },
      "box4": {
        "height": 110,
        "width": 110,
        "x": 130,
        "y": 130,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 110,
          "key": "box1",
          "row": 0,
          "rowSpan": 1,
          "width": 110,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 110,
          "key": "box2",
          "row": 0,
          "rowSpan": 1,
          "width": 110,
          "x": 130,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 110,
          "key": "box3",
          "row": 1,
          "rowSpan": 1,
          "width": 110,
          "x": 0,
          "y": 130,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 110,
          "key": "box4",
          "row": 1,
          "rowSpan": 1,
          "width": 110,
          "x": 130,
          "y": 130,
        },
      ],
      "columnGap": 20,
      "columnSizes": [
        110,
        110,
      ],
      "itemCoordinates": {
        "box1": {
          "height": 110,
          "width": 110,
          "x": 0,
          "y": 0,
        },
        "box2": {
          "height": 110,
          "width": 110,
          "x": 130,
          "y": 0,
        },
        "box3": {
          "height": 110,
          "width": 110,
          "x": 0,
          "y": 130,
        },
        "box4": {
          "height": 110,
          "width": 110,
          "x": 130,
          "y": 130,
        },
      },
      "rowGap": 20,
      "rowSizes": [
        110,
        110,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level06.test.ts
````typescript
import { expect, test } from "bun:test"
import level06 from "testcases/level06"
import browserResult from "testcases/level06.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level06", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level06, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "a": {
        "height": 95,
        "width": 80,
        "x": 0,
        "y": 0,
      },
      "b": {
        "height": 95,
        "width": 80,
        "x": 110,
        "y": 0,
      },
      "c": {
        "height": 95,
        "width": 80,
        "x": 220,
        "y": 0,
      },
      "d": {
        "height": 95,
        "width": 80,
        "x": 0,
        "y": 105,
      },
      "e": {
        "height": 95,
        "width": 80,
        "x": 110,
        "y": 105,
      },
      "f": {
        "height": 95,
        "width": 80,
        "x": 220,
        "y": 105,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "a": {
        "height": 95,
        "width": 80,
        "x": 0,
        "y": 0,
      },
      "b": {
        "height": 95,
        "width": 80,
        "x": 110,
        "y": 0,
      },
      "c": {
        "height": 95,
        "width": 80,
        "x": 220,
        "y": 0,
      },
      "d": {
        "height": 95,
        "width": 80,
        "x": 0,
        "y": 105,
      },
      "e": {
        "height": 95,
        "width": 80,
        "x": 110,
        "y": 105,
      },
      "f": {
        "height": 95,
        "width": 80,
        "x": 220,
        "y": 105,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 95,
          "key": "a",
          "row": 0,
          "rowSpan": 1,
          "width": 80,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 95,
          "key": "b",
          "row": 0,
          "rowSpan": 1,
          "width": 80,
          "x": 110,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 95,
          "key": "c",
          "row": 0,
          "rowSpan": 1,
          "width": 80,
          "x": 220,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 95,
          "key": "d",
          "row": 1,
          "rowSpan": 1,
          "width": 80,
          "x": 0,
          "y": 105,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 95,
          "key": "e",
          "row": 1,
          "rowSpan": 1,
          "width": 80,
          "x": 110,
          "y": 105,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 95,
          "key": "f",
          "row": 1,
          "rowSpan": 1,
          "width": 80,
          "x": 220,
          "y": 105,
        },
      ],
      "columnGap": 30,
      "columnSizes": [
        80,
        80,
        80,
      ],
      "itemCoordinates": {
        "a": {
          "height": 95,
          "width": 80,
          "x": 0,
          "y": 0,
        },
        "b": {
          "height": 95,
          "width": 80,
          "x": 110,
          "y": 0,
        },
        "c": {
          "height": 95,
          "width": 80,
          "x": 220,
          "y": 0,
        },
        "d": {
          "height": 95,
          "width": 80,
          "x": 0,
          "y": 105,
        },
        "e": {
          "height": 95,
          "width": 80,
          "x": 110,
          "y": 105,
        },
        "f": {
          "height": 95,
          "width": 80,
          "x": 220,
          "y": 105,
        },
      },
      "rowGap": 10,
      "rowSizes": [
        95,
        95,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level07.test.ts
````typescript
import { expect, test } from "bun:test"
import level07 from "testcases/level07"
import browserResult from "testcases/level07.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level07", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level07, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 200,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "footer": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 250,
      },
      "header": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 200,
        "width": 100,
        "x": 0,
        "y": 50,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 200,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "footer": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 250,
      },
      "header": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 200,
        "width": 100,
        "x": 0,
        "y": 50,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 2,
          "height": 50,
          "key": "header",
          "row": 0,
          "rowSpan": 1,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 200,
          "key": "sidebar",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 50,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 200,
          "key": "content",
          "row": 1,
          "rowSpan": 1,
          "width": 200,
          "x": 100,
          "y": 50,
        },
        {
          "column": 0,
          "columnSpan": 2,
          "height": 50,
          "key": "footer",
          "row": 2,
          "rowSpan": 1,
          "width": 300,
          "x": 0,
          "y": 250,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        200,
      ],
      "itemCoordinates": {
        "content": {
          "height": 200,
          "width": 200,
          "x": 100,
          "y": 50,
        },
        "footer": {
          "height": 50,
          "width": 300,
          "x": 0,
          "y": 250,
        },
        "header": {
          "height": 50,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        "sidebar": {
          "height": 200,
          "width": 100,
          "x": 0,
          "y": 50,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        50,
        200,
        50,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level08.test.ts
````typescript
import { expect, test } from "bun:test"
import level08 from "testcases/level08"
import browserResult from "testcases/level08.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level08", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level08, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "a": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "b": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 100,
      },
      "c": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 200,
      },
      "d": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "a": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "b": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 100,
      },
      "c": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 200,
      },
      "d": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 100,
          "key": "a",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "b",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 100,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 100,
          "key": "c",
          "row": 2,
          "rowSpan": 1,
          "width": 100,
          "x": 100,
          "y": 200,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "d",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 0,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
        100,
      ],
      "itemCoordinates": {
        "a": {
          "height": 100,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        "b": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 100,
        },
        "c": {
          "height": 100,
          "width": 100,
          "x": 100,
          "y": 200,
        },
        "d": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level09.test.ts
````typescript
import { expect, test } from "bun:test"
import level09 from "testcases/level09"
import browserResult from "testcases/level09.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level09", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level09, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "big": {
        "height": 200,
        "width": 200,
        "x": 0,
        "y": 0,
      },
      "bottom": {
        "height": 100,
        "width": 300,
        "x": 0,
        "y": 200,
      },
      "small1": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
      "small2": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 100,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "big": {
        "height": 200,
        "width": 200,
        "x": 0,
        "y": 0,
      },
      "bottom": {
        "height": 100,
        "width": 300,
        "x": 0,
        "y": 200,
      },
      "small1": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
      "small2": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 100,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 2,
          "height": 200,
          "key": "big",
          "row": 0,
          "rowSpan": 2,
          "width": 200,
          "x": 0,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "small1",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "small2",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 100,
        },
        {
          "column": 0,
          "columnSpan": 3,
          "height": 100,
          "key": "bottom",
          "row": 2,
          "rowSpan": 1,
          "width": 300,
          "x": 0,
          "y": 200,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
        100,
      ],
      "itemCoordinates": {
        "big": {
          "height": 200,
          "width": 200,
          "x": 0,
          "y": 0,
        },
        "bottom": {
          "height": 100,
          "width": 300,
          "x": 0,
          "y": 200,
        },
        "small1": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 0,
        },
        "small2": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 100,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level10.test.ts
````typescript
import { expect, test } from "bun:test"
import level10 from "testcases/level10"
import browserResult from "testcases/level10.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level10", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level10, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "first": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "fourth": {
        "height": 100,
        "width": 100,
        "x": 300,
        "y": 0,
      },
      "second": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 0,
      },
      "third": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "first": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "fourth": {
        "height": 100,
        "width": 100,
        "x": 300,
        "y": 0,
      },
      "second": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 0,
      },
      "third": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 100,
          "key": "first",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 100,
          "key": "second",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "third",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 0,
        },
        {
          "column": 3,
          "columnSpan": 1,
          "height": 100,
          "key": "fourth",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 300,
          "y": 0,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
        100,
        100,
      ],
      "itemCoordinates": {
        "first": {
          "height": 100,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        "fourth": {
          "height": 100,
          "width": 100,
          "x": 300,
          "y": 0,
        },
        "second": {
          "height": 100,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        "third": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level11.test.ts
````typescript
import { expect, test } from "bun:test"
import level11 from "testcases/level11"
import browserResult from "testcases/level11.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level11", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level11, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "another-item": {
        "height": 25,
        "width": 30,
        "x": 135,
        "y": 37.5,
      },
      "center-item": {
        "height": 25,
        "width": 30,
        "x": 35,
        "y": 37.5,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "another-item": {
        "height": 25,
        "width": 30,
        "x": 135,
        "y": 37.5,
      },
      "center-item": {
        "height": 25,
        "width": 30,
        "x": 35,
        "y": 37.5,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 25,
          "key": "center-item",
          "row": 0,
          "rowSpan": 1,
          "width": 30,
          "x": 35,
          "y": 37.5,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 25,
          "key": "another-item",
          "row": 0,
          "rowSpan": 1,
          "width": 30,
          "x": 135,
          "y": 37.5,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
      ],
      "itemCoordinates": {
        "another-item": {
          "height": 25,
          "width": 30,
          "x": 135,
          "y": 37.5,
        },
        "center-item": {
          "height": 25,
          "width": 30,
          "x": 35,
          "y": 37.5,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level12.test.ts
````typescript
import { expect, test } from "bun:test"
import level12 from "testcases/level12"
import browserResult from "testcases/level12.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level12", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level12, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "auto-width": {
        "height": 100,
        "width": 50,
        "x": 0,
        "y": 0,
      },
      "fixed-width": {
        "height": 100,
        "width": 100,
        "x": 50,
        "y": 0,
      },
      "flexible": {
        "height": 100,
        "width": 150,
        "x": 150,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "auto-width": {
        "height": 100,
        "width": 100,
        "x": 0,
        "y": 0,
      },
      "fixed-width": {
        "height": 100,
        "width": 100,
        "x": 100,
        "y": 0,
      },
      "flexible": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 100,
          "key": "auto-width",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 100,
          "key": "fixed-width",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "flexible",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 0,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
        100,
      ],
      "itemCoordinates": {
        "auto-width": {
          "height": 100,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        "fixed-width": {
          "height": 100,
          "width": 100,
          "x": 100,
          "y": 0,
        },
        "flexible": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level13.test.ts
````typescript
import { expect, test } from "bun:test"
import level13 from "testcases/level13"
import browserResult from "testcases/level13.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level13", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level13, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "ads": {
        "height": 300,
        "width": 80,
        "x": 320,
        "y": 0,
      },
      "main": {
        "height": 300,
        "width": 220,
        "x": 100,
        "y": 0,
      },
      "sidebar": {
        "height": 300,
        "width": 100,
        "x": 0,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "ads": {
        "height": 300,
        "width": 80,
        "x": 320,
        "y": 0,
      },
      "main": {
        "height": 300,
        "width": 220,
        "x": 100,
        "y": 0,
      },
      "sidebar": {
        "height": 300,
        "width": 100,
        "x": 0,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 300,
          "key": "sidebar",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 300,
          "key": "main",
          "row": 0,
          "rowSpan": 1,
          "width": 220,
          "x": 100,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 300,
          "key": "ads",
          "row": 0,
          "rowSpan": 1,
          "width": 80,
          "x": 320,
          "y": 0,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        220,
        80,
      ],
      "itemCoordinates": {
        "ads": {
          "height": 300,
          "width": 80,
          "x": 320,
          "y": 0,
        },
        "main": {
          "height": 300,
          "width": 220,
          "x": 100,
          "y": 0,
        },
        "sidebar": {
          "height": 300,
          "width": 100,
          "x": 0,
          "y": 0,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        300,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level14.test.ts
````typescript
import { expect, test } from "bun:test"
import level14 from "testcases/level14"
import browserResult from "testcases/level14.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level14", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level14, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "background": {
        "height": 300,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "corner": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 200,
      },
      "overlay1": {
        "height": 200,
        "width": 200,
        "x": 0,
        "y": 0,
      },
      "overlay2": {
        "height": 200,
        "width": 200,
        "x": 100,
        "y": 100,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "background": {
        "height": 300,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "corner": {
        "height": 100,
        "width": 100,
        "x": 200,
        "y": 200,
      },
      "overlay1": {
        "height": 200,
        "width": 200,
        "x": 0,
        "y": 0,
      },
      "overlay2": {
        "height": 200,
        "width": 200,
        "x": 100,
        "y": 100,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 3,
          "height": 300,
          "key": "background",
          "row": 0,
          "rowSpan": 3,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 2,
          "height": 200,
          "key": "overlay1",
          "row": 0,
          "rowSpan": 2,
          "width": 200,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 2,
          "height": 200,
          "key": "overlay2",
          "row": 1,
          "rowSpan": 2,
          "width": 200,
          "x": 100,
          "y": 100,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 100,
          "key": "corner",
          "row": 2,
          "rowSpan": 1,
          "width": 100,
          "x": 200,
          "y": 200,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        100,
        100,
      ],
      "itemCoordinates": {
        "background": {
          "height": 300,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        "corner": {
          "height": 100,
          "width": 100,
          "x": 200,
          "y": 200,
        },
        "overlay1": {
          "height": 200,
          "width": 200,
          "x": 0,
          "y": 0,
        },
        "overlay2": {
          "height": 200,
          "width": 200,
          "x": 100,
          "y": 100,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level15.test.ts
````typescript
import { expect, test } from "bun:test"
import level15 from "testcases/level15"
import browserResult from "testcases/level15.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level15", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level15, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "center-item": {
        "height": 12,
        "width": 40,
        "x": 0,
        "y": 188,
      },
      "end-item": {
        "height": 20,
        "width": 30,
        "x": 200,
        "y": 80,
      },
      "start-item": {
        "height": 30,
        "width": 50,
        "x": 0,
        "y": 70,
      },
      "stretch-item": {
        "height": 40,
        "width": 24,
        "x": 200,
        "y": 160,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "center-item": {
        "height": 12,
        "width": 40,
        "x": 0,
        "y": 188,
      },
      "end-item": {
        "height": 20,
        "width": 30,
        "x": 200,
        "y": 80,
      },
      "start-item": {
        "height": 30,
        "width": 50,
        "x": 0,
        "y": 70,
      },
      "stretch-item": {
        "height": 40,
        "width": 24,
        "x": 200,
        "y": 160,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 30,
          "key": "start-item",
          "row": 0,
          "rowSpan": 1,
          "width": 50,
          "x": 0,
          "y": 70,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 20,
          "key": "end-item",
          "row": 0,
          "rowSpan": 1,
          "width": 30,
          "x": 200,
          "y": 80,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 12,
          "key": "center-item",
          "row": 1,
          "rowSpan": 1,
          "width": 40,
          "x": 0,
          "y": 188,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 40,
          "key": "stretch-item",
          "row": 1,
          "rowSpan": 1,
          "width": 24,
          "x": 200,
          "y": 160,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        200,
        200,
      ],
      "itemCoordinates": {
        "center-item": {
          "height": 12,
          "width": 40,
          "x": 0,
          "y": 188,
        },
        "end-item": {
          "height": 20,
          "width": 30,
          "x": 200,
          "y": 80,
        },
        "start-item": {
          "height": 30,
          "width": 50,
          "x": 0,
          "y": 70,
        },
        "stretch-item": {
          "height": 40,
          "width": 24,
          "x": 200,
          "y": 160,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        100,
        100,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level16.test.ts
````typescript
import { expect, test } from "bun:test"
import level16 from "testcases/level16"
import browserResult from "testcases/level16.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level16", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level16, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 243,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "footer": {
        "height": 7,
        "width": 300,
        "x": 0,
        "y": 293,
      },
      "header": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 193,
        "width": 100,
        "x": 0,
        "y": 50,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "content": {
        "height": 250,
        "width": 200,
        "x": 100,
        "y": 50,
      },
      "footer": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 250,
      },
      "header": {
        "height": 50,
        "width": 300,
        "x": 0,
        "y": 0,
      },
      "sidebar": {
        "height": 200,
        "width": 100,
        "x": 0,
        "y": 50,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 2,
          "height": 50,
          "key": "header",
          "row": 0,
          "rowSpan": 1,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        {
          "column": 0,
          "columnSpan": 1,
          "height": 200,
          "key": "sidebar",
          "row": 1,
          "rowSpan": 1,
          "width": 100,
          "x": 0,
          "y": 50,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 250,
          "key": "content",
          "row": 1,
          "rowSpan": 2,
          "width": 200,
          "x": 100,
          "y": 50,
        },
        {
          "column": 0,
          "columnSpan": 2,
          "height": 50,
          "key": "footer",
          "row": 2,
          "rowSpan": 1,
          "width": 300,
          "x": 0,
          "y": 250,
        },
      ],
      "columnGap": 0,
      "columnSizes": [
        100,
        200,
      ],
      "itemCoordinates": {
        "content": {
          "height": 250,
          "width": 200,
          "x": 100,
          "y": 50,
        },
        "footer": {
          "height": 50,
          "width": 300,
          "x": 0,
          "y": 250,
        },
        "header": {
          "height": 50,
          "width": 300,
          "x": 0,
          "y": 0,
        },
        "sidebar": {
          "height": 200,
          "width": 100,
          "x": 0,
          "y": 50,
        },
      },
      "rowGap": 0,
      "rowSizes": [
        50,
        200,
        50,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: tests/level17.test.ts
````typescript
import { expect, test } from "bun:test"
import level17 from "testcases/level17"
import browserResult from "testcases/level17.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("level17", () => {
  const { laidOutResult, outputViz, layout } = testGrid(level17, browserResult)

  expect(browserResult).toMatchInlineSnapshot(`
    {
      "item1": {
        "height": 40,
        "width": 50,
        "x": 0,
        "y": 0,
      },
      "item2": {
        "height": 40,
        "width": 80,
        "x": 60,
        "y": 0,
      },
      "item3": {
        "height": 40,
        "width": 100,
        "x": 150,
        "y": 0,
      },
    }
  `)
  expect(laidOutResult).toMatchInlineSnapshot(`
    {
      "item1": {
        "height": 40,
        "width": 50,
        "x": 0,
        "y": 0,
      },
      "item2": {
        "height": 40,
        "width": 80,
        "x": 60,
        "y": 0,
      },
      "item3": {
        "height": 40,
        "width": 100,
        "x": 150,
        "y": 0,
      },
    }
  `)

  expect(layout).toMatchInlineSnapshot(`
    {
      "cells": [
        {
          "column": 0,
          "columnSpan": 1,
          "height": 40,
          "key": "item1",
          "row": 0,
          "rowSpan": 1,
          "width": 50,
          "x": 0,
          "y": 0,
        },
        {
          "column": 1,
          "columnSpan": 1,
          "height": 40,
          "key": "item2",
          "row": 0,
          "rowSpan": 1,
          "width": 80,
          "x": 60,
          "y": 0,
        },
        {
          "column": 2,
          "columnSpan": 1,
          "height": 40,
          "key": "item3",
          "row": 0,
          "rowSpan": 1,
          "width": 100,
          "x": 150,
          "y": 0,
        },
      ],
      "columnGap": 10,
      "columnSizes": [
        50,
        80,
        100,
      ],
      "itemCoordinates": {
        "item1": {
          "height": 40,
          "width": 50,
          "x": 0,
          "y": 0,
        },
        "item2": {
          "height": 40,
          "width": 80,
          "x": 60,
          "y": 0,
        },
        "item3": {
          "height": 40,
          "width": 100,
          "x": 150,
          "y": 0,
        },
      },
      "rowGap": 10,
      "rowSizes": [
        40,
        0,
      ],
    }
  `)
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
````

## File: .gitignore
````
# dependencies (bun install)
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store
.vscode
.aider*
playwright-report
test-results

*.diff.png
.vercel
cosmos-export
````

## File: biome.json
````json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "formatter": {
    "enabled": true,
    "indentStyle": "space"
  },
  "files": {
    "includes": ["**", "!**/cosmos-export", "!**/dist", "!**/package.json"]
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "trailingCommas": "all",
      "semicolons": "asNeeded",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off"
      },
      "complexity": {
        "noForEach": "error",
        "useLiteralKeys": "off"
      },
      "a11y": {
        "noAccessKey": "off",
        "noAriaHiddenOnFocusable": "off",
        "noAriaUnsupportedElements": "off",
        "noAutofocus": "off",
        "noDistractingElements": "off",
        "noHeaderScope": "off",
        "noInteractiveElementToNoninteractiveRole": "off",
        "noLabelWithoutControl": "off",
        "noNoninteractiveElementToInteractiveRole": "off",
        "noNoninteractiveTabindex": "off",
        "noPositiveTabindex": "off",
        "noRedundantAlt": "off",
        "noRedundantRoles": "off",
        "noStaticElementInteractions": "off",
        "noSvgWithoutTitle": "off",
        "useAltText": "off",
        "useAnchorContent": "off",
        "useAriaActivedescendantWithTabindex": "off",
        "useAriaPropsForRole": "off",
        "useAriaPropsSupportedByRole": "off",
        "useButtonType": "off",
        "useFocusableInteractive": "off",
        "useHeadingContent": "off",
        "useHtmlLang": "off",
        "useIframeTitle": "off",
        "useKeyWithClickEvents": "off",
        "useKeyWithMouseEvents": "off",
        "useMediaCaption": "off",
        "useSemanticElements": "off",
        "useValidAnchor": "off",
        "useValidAriaProps": "off",
        "useValidAriaRole": "off",
        "useValidAriaValues": "off",
        "useValidAutocomplete": "off",
        "useValidLang": "off"
      },
      "style": {
        "useSingleVarDeclarator": "error",
        "noParameterAssign": "off",
        "noUselessElse": "off",
        "noNonNullAssertion": "off",
        "useNumberNamespace": "off",
        "noUnusedTemplateLiteral": "off",
        "useFilenamingConvention": {
          "level": "error",
          "options": {
            "strictCase": true,
            "requireAscii": true,
            "filenameCases": ["kebab-case", "export"]
          }
        },
        "useAsConstAssertion": "error",
        "useDefaultParameterLast": "error",
        "useEnumInitializers": "error",
        "useSelfClosingElements": "error",
        "noInferrableTypes": "error"
      }
    }
  }
}
````

## File: bunfig.toml
````toml
[test]
preload = ["./tests/fixtures/preload.ts"]

[install.lockfile]
save = false
````

## File: CLAUDE.md
````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Testing

- `bun test` - Run all tests
- `bun test <pattern>` - Run tests matching pattern
- `bun test path/to/test` - Run specific test

### Formatting & Linting

- `bun run format` - Format code with Biome
- `bun run format:check` - Check formatting without making changes

### Package Management

Use `bun` instead of npm/yarn/pnpm for all package management operations:

- `bun install` - Install dependencies
- `bun add <package>` - Add dependency
- `bun remove <package>` - Remove dependency

## Architecture

This is a TypeScript library (`@tscircuit/minigrid`) that implements a CSS Grid layout engine.

### Core Structure

- `lib/CssGrid.ts` - Main CssGrid class with layout computation and HTML conversion
- `lib/types.ts` - TypeScript interfaces and type definitions for grid configuration
- `lib/index.ts` - Main export file

### Key Classes & Types

- `CssGrid` class - Core grid implementation with `layout()`, `convertToHtml()`, and `visualize()` methods
- `CssGridOptions` interface - Configuration for grid container and items
- `GridItem` interface - Individual grid item configuration with positioning
- `GridCell` interface - Final computed position of grid items

### Testing Structure

- Test files use Bun's built-in test runner
- Tests are in `tests/` directory with corresponding testcases in `testcases/`
- Import pattern: `import { expect, test } from "bun:test"`

### Configuration

- Uses Biome for formatting and linting (configured in `biome.json`)
- TypeScript configuration in `tsconfig.json` with strict mode enabled
- Path aliases configured: `lib/*`, `tests/*`, `testcases/*`

## Introducing Test Cases

1. Create a test case in `testcases/levelXX.ts`
2. Generate the browser result by running `bun run generate-browser-results`
3. Create a test in `tests/levelXX.test.ts` with the following structure:
4. Run `bun test tests/levelXX.test.ts -u` to see the test results and update the snapshots

```tsx
import { expect, test } from "bun:test"
import levelXX from "testcases/levelXX"
import browserResult from "testcases/levelXX.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("levelXX", () => {
  const { laidOutResult, outputViz, layout } = testGrid(levelXX, browserResult)

  expect(browserResult).toMatchInlineSnapshot()
  expect(laidOutResult).toMatchInlineSnapshot()

  expect(layout).toMatchInlineSnapshot()
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
```
````

## File: cosmos.config.json
````json
{
  "$schema": "http://json.schemastore.org/cosmos-config",
  "plugins": ["react-cosmos-plugin-vite"],
  "fixtureFileSuffix": "page"
}
````

## File: index.html
````html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Cosmos Vite Renderer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## File: LICENSE
````
MIT License

Copyright (c) 2024 tscircuit Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: package.json
````json
{
  "name": "minicssgrid",
  "version": "0.0.5",
  "main": "dist/index.js",
  "type": "module",
  "files": [
    "dist"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/tscircuit/minicssgrid"
  },
  "license": "MIT",
  "scripts": {
    "start": "cosmos",
    "build": "tsup ./lib/index.ts --format esm --dts",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "build:site": "cosmos-export",
    "generate-browser-results": "bun run scripts/generate-browser-results.ts && biome format --write ./testcases"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.1.2",
    "@playwright/test": "^1.54.1",
    "@types/bun": "latest",
    "bun-match-svg": "^0.0.12",
    "graphics-debug": "^0.0.61",
    "playwright": "^1.54.1",
    "react-cosmos": "^7.0.0",
    "react-cosmos-plugin-vite": "^7.0.0",
    "tsup": "^8.5.0"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
````

## File: playwright.config.ts
````typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/playwright.test.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    viewport: { width: 120, height: 120 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
````

## File: README.md
````markdown
# minicssgrid

A tiny CSS grid implementation in TypeScript that provides programmatic CSS Grid layout computation.

[Online Playground](https://minigrid.tscircuit.com)

<img width="250" height="250" alt="image" src="https://github.com/user-attachments/assets/c0cd5c34-a62c-40e4-b132-fc2f81b6fc49" />

## Installation

```bash
bun add minicssgrid
# or
npm install minicssgrid
```

## Quick Start

```typescript
import { CssGrid } from "minicssgrid"

// Create a simple 2x2 grid
const grid = new CssGrid({
  containerWidth: 200,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  children: [
    { key: "item1" },
    { key: "item2" },
    { key: "item3" },
    { key: "item4" },
  ],
})

// Get computed layout
const { cells, itemCoordinates } = grid.layout()
console.log(itemCoordinates)
// Output: {
//   item1: { x: 0, y: 0, width: 100, height: 100 },
//   item2: { x: 100, y: 0, width: 100, height: 100 },
//   item3: { x: 0, y: 100, width: 100, height: 100 },
//   item4: { x: 100, y: 100, width: 100, height: 100 }
// }
```

## API Reference

### CssGrid Class

The main class for creating and computing CSS Grid layouts.

```typescript
const grid = new CssGrid(options: CssGridOptions)
```

#### Methods

- **`layout()`** - Returns computed layout with cell positions and coordinates
- **`convertToHtml()`** - Generates HTML representation of the grid
- **`visualize()`** - Returns graphics object for debugging visualization

### CssGridOptions Interface

Configuration object for the grid container and its items.

```typescript
interface CssGridOptions {
  children: GridItem[] // Grid items to layout
  gridTemplateRows?: GridTemplate // Row track definitions
  gridTemplateColumns?: GridTemplate // Column track definitions
  gap?: number | [number, number] // Gap between grid items
  justifyItems?: "start" | "end" | "center" | "stretch"
  alignItems?: "start" | "end" | "center" | "stretch"
  containerWidth?: number // Container dimensions
  containerHeight?: number
}
```

### GridItem Interface

Individual grid item configuration.

```typescript
interface GridItem {
  key: string // Unique identifier

  // Positioning (1-based like CSS Grid)
  row?: number | string
  column?: number | string
  rowSpan?: number | string
  columnSpan?: number | string
  rowStart?: number | string
  columnStart?: number | string
  rowEnd?: number | string
  columnEnd?: number | string

  // Content sizing
  contentWidth?: number | string
  contentHeight?: number | string

  // Other properties
  area?: string // Named grid area
  order?: number | string // Display order
  payload?: unknown // Custom data
}
```

## Grid Templates

Grid templates can be defined as strings (CSS-like) or structured arrays:

### String Format

```typescript
gridTemplateColumns: "100px 1fr 2fr"
gridTemplateRows: "repeat(3, 1fr)"
gridTemplateColumns: "20% 20% 20% 20% 20%"
```

### Array Format

```typescript
gridTemplateColumns: ["100px", "1fr", "2fr"]
gridTemplateRows: ["repeat(3, 1fr)"]
```

### Supported Track Sizes

- **Fixed**: `"100px"`, `"50%"`
- **Flexible**: `"1fr"`, `"2fr"`
- **Keywords**: `"auto"`, `"min-content"`, `"max-content"`
- **Functions**: `"minmax(100px, 1fr)"`, `"repeat(3, 1fr)"`

## Usage Examples

### Basic Grid Layout

```typescript
const grid = new CssGrid({
  containerWidth: 300,
  containerHeight: 200,
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  children: [
    { key: "header" },
    { key: "nav" },
    { key: "main" },
    { key: "aside" },
    { key: "footer" },
  ],
})
```

### Explicit Item Placement

```typescript
const grid = new CssGrid({
  containerWidth: 400,
  containerHeight: 300,
  gridTemplateColumns: "repeat(4, 1fr)",
  gridTemplateRows: "repeat(3, 1fr)",
  children: [
    { key: "header", columnStart: 1, columnEnd: 5, row: 1 },
    { key: "sidebar", column: 1, rowStart: 2, rowEnd: 4 },
    { key: "content", columnStart: 2, columnEnd: 5, rowStart: 2, rowEnd: 4 },
  ],
})
```

### Grid with Spanning Items

```typescript
const grid = new CssGrid({
  containerWidth: 300,
  containerHeight: 300,
  gridTemplateColumns: "1fr 2fr",
  gridTemplateRows: "50px 1fr 50px",
  children: [
    { key: "header", columnSpan: 2 }, // Spans 2 columns
    { key: "sidebar" }, // Auto-placed
    { key: "content" }, // Auto-placed
    { key: "footer", columnSpan: 2 }, // Spans 2 columns
  ],
})
```

### Grid with Gaps

```typescript
const grid = new CssGrid({
  containerWidth: 240,
  containerHeight: 240,
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  gap: 20, // 20px gap between items
  children: [
    { key: "box1" },
    { key: "box2" },
    { key: "box3" },
    { key: "box4" },
  ],
})
```

### Different Gap Values

```typescript
const grid = new CssGrid({
  gridTemplateColumns: "1fr 1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  gap: [10, 20], // [rowGap, columnGap]
  children: [
    /* ... */
  ],
})
```

### Item Ordering

```typescript
const grid = new CssGrid({
  containerWidth: 400,
  containerHeight: 100,
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gridTemplateRows: "1fr",
  children: [
    { key: "first", order: 3 }, // Appears third
    { key: "second", order: 1 }, // Appears first
    { key: "third", order: 2 }, // Appears second
    { key: "fourth" }, // Default order (0), appears last
  ],
})
```

### Content Sizing

```typescript
const grid = new CssGrid({
  gridTemplateColumns: "auto 1fr auto",
  children: [
    { key: "icon", contentWidth: 24, contentHeight: 24 },
    { key: "text", contentWidth: 200 },
    { key: "button", contentWidth: 80, contentHeight: 32 },
  ],
})
```

### Alignment

```typescript
const grid = new CssGrid({
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "1fr 1fr",
  justifyItems: "center", // Horizontal alignment
  alignItems: "start", // Vertical alignment
  children: [
    /* ... */
  ],
})
```

## Working with Layout Results

The `layout()` method returns detailed information about the computed grid:

```typescript
const { cells, rowSizes, columnSizes, rowGap, columnGap, itemCoordinates } =
  grid.layout()

// Individual cell information
cells.forEach((cell) => {
  console.log(`${cell.key}: row ${cell.row}, col ${cell.column}`)
  console.log(`Position: (${cell.x}, ${cell.y})`)
  console.log(`Size: ${cell.width} × ${cell.height}`)
  console.log(`Spans: ${cell.rowSpan} rows, ${cell.columnSpan} columns`)
})

// Quick access to item coordinates
const headerCoords = itemCoordinates.header
// { x: 0, y: 0, width: 300, height: 50 }

// Track information
console.log("Column widths:", columnSizes) // [100, 200, 100]
console.log("Row heights:", rowSizes) // [50, 200, 50]
```

## HTML Generation

Generate HTML representation of your grid:

```typescript
const htmlString = grid.convertToHtml()
console.log(htmlString)
```

This creates a `<div>` with CSS Grid styles and child elements positioned accordingly.

## Development & Testing

### Running Tests

```bash
bun test                    # Run all tests
bun test level01           # Run specific test
```

### Adding Test Cases

## Introducing Test Cases

1. Create a test case in `testcases/levelXX.ts`
2. Generate the browser result by running `bun run generate-browser-results`
3. Create a test in `tests/levelXX.test.ts` with the following structure:
4. Run `bun test tests/levelXX.test.ts -u` to see the test results and update the snapshots

```tsx
import { expect, test } from "bun:test"
import levelXX from "testcases/levelXX"
import browserResult from "testcases/levelXX.browser-result.json"
import { testGrid } from "./fixtures/testGrid"

test("levelXX", () => {
  const { laidOutResult, outputViz, layout } = testGrid(levelXX, browserResult)

  expect(browserResult).toMatchInlineSnapshot()
  expect(laidOutResult).toMatchInlineSnapshot()

  expect(layout).toMatchInlineSnapshot()
  expect(outputViz).toMatchSvgSnapshot(import.meta.path)

  if (!process.env.BUN_UPDATE_SNAPSHOTS) {
    expect(laidOutResult).toEqual(browserResult)
  }
})
```
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    "paths": {
      "testcases/*": ["./testcases/*"],
      "tests/*": ["./tests/*"],
      "lib/*": ["./lib/*"]
    },

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
````

## File: vite.config.ts
````typescript
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      testcases: resolve(__dirname, "./testcases"),
      tests: resolve(__dirname, "./tests"),
      lib: resolve(__dirname, "./lib"),
    },
  },
})
````
