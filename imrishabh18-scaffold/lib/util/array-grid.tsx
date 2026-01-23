import React from "react"

type Corner = "BL" | "TL" | "TR" | "BR"
type Anchor = Corner | "center"

interface GridPoint {
  x: number
  y: number
  index: number
  gridIndex: number
  row: number
  col: number
  totalRows: number
  totalCols: number
}

type SkipPattern = "corners" | "edges" | "center"
type ReplacePattern = "corners" | "edges" | "center"

export interface ArrayGridProps {
  cols: number
  rows: number
  spacingX: number
  spacingY: number
  startX: number
  startY: number
  startCorner?: Corner
  anchor?: Anchor
  startIndex?: number
  skipPattern?: SkipPattern | SkipPattern[]
  skipWhen?: (point: GridPoint) => boolean
  replacePattern?: Partial<Record<ReplacePattern, React.ReactElement>>
  replaceWhen?: (point: GridPoint) => React.ReactElement | undefined
  children: ((point: GridPoint) => React.ReactNode) | React.ReactElement
}

// Pattern matching helper functions
function isCorner(point: GridPoint, cols: number, rows: number): boolean {
  return (
    (point.row === 0 || point.row === rows - 1) &&
    (point.col === 0 || point.col === cols - 1)
  )
}

function isEdge(point: GridPoint, cols: number, rows: number): boolean {
  return (
    point.row === 0 ||
    point.row === rows - 1 ||
    point.col === 0 ||
    point.col === cols - 1
  )
}

function isCenter(point: GridPoint, cols: number, rows: number): boolean {
  if (rows % 2 === 0 || cols % 2 === 0) return false
  return (
    point.row === Math.floor(rows / 2) && point.col === Math.floor(cols / 2)
  )
}

function createArrayGrid(
  cols: number,
  rows: number,
  spacingX: number,
  spacingY: number,
  startX: number,
  startY: number,
  startCorner: Corner = "BL",
  anchor: Anchor = "BL",
  startIndex: number = 0,
): GridPoint[] {
  const points: GridPoint[] = []
  let index = startIndex

  // Calculate total grid dimensions
  const gridWidth = (cols - 1) * spacingX
  const gridHeight = (rows - 1) * spacingY

  // Adjust start position based on anchor
  // Note: BL is the base case where Row 0 starts at startY (bottom)
  let adjustedStartX = startX
  let adjustedStartY = startY

  switch (anchor) {
    case "center":
      adjustedStartX = startX - gridWidth / 2
      adjustedStartY = startY - gridHeight / 2
      break
    case "BL":
      // No adjustment needed - Row 0 starts at bottom-left (startX, startY)
      break
    case "BR":
      adjustedStartX = startX - gridWidth
      break
    case "TL":
      adjustedStartY = startY + gridHeight
      break
    case "TR":
      adjustedStartX = startX - gridWidth
      adjustedStartY = startY + gridHeight
      break
  }

  // Determine iteration order based on start corner
  // Note: Row 0 is at the bottom (smaller row index = lower Y position after calculation)
  // BL (default): Start bottom-left, go right then up
  // TL: Start top-left, go right then down
  // BR: Start bottom-right, go left then up
  // TR: Start top-right, go left then down
  const rowOrder = startCorner.includes("B")
    ? Array.from({ length: rows }, (_, i) => i)
    : Array.from({ length: rows }, (_, i) => rows - 1 - i)

  const colOrder = startCorner.includes("R")
    ? Array.from({ length: cols }, (_, i) => cols - 1 - i)
    : Array.from({ length: cols }, (_, i) => i)

  // Generate grid points
  for (const row of rowOrder) {
    for (const col of colOrder) {
      const x = adjustedStartX + col * spacingX
      const y = adjustedStartY + row * spacingY

      points.push({
        x,
        y,
        index: index,
        gridIndex: index,
        row,
        col,
        totalRows: rows,
        totalCols: cols,
      })
      index++
    }
  }

  return points
}

export const ArrayGrid: React.FC<ArrayGridProps> = ({
  cols,
  rows,
  spacingX,
  spacingY,
  startX,
  startY,
  startCorner = "BL",
  anchor = "BL",
  startIndex = 0,
  skipPattern,
  skipWhen,
  replacePattern,
  replaceWhen,
  children,
}) => {
  let points = createArrayGrid(
    cols,
    rows,
    spacingX,
    spacingY,
    startX,
    startY,
    startCorner,
    anchor,
    startIndex,
  )

  // Apply filtering based on skipPattern and/or skipWhen
  const shouldSkip = (point: GridPoint): boolean => {
    // Check custom predicate first
    if (skipWhen && skipWhen(point)) return true

    // Check named patterns
    if (skipPattern) {
      const patterns = Array.isArray(skipPattern) ? skipPattern : [skipPattern]
      for (const pattern of patterns) {
        if (pattern === "corners" && isCorner(point, cols, rows)) return true
        if (pattern === "edges" && isEdge(point, cols, rows)) return true
        if (pattern === "center" && isCenter(point, cols, rows)) return true
      }
    }

    return false
  }

  // Filter out skipped points
  points = points.filter((p) => !shouldSkip(p))

  // Renumber indices densely (sequential after filtering)
  points.forEach((p, i) => {
    p.index = startIndex + i
  })

  // Helper function to determine which component to use for each point
  // Precedence: replaceWhen → replacePattern → default child
  const getComponentForPoint = (
    point: GridPoint,
  ): React.ReactElement | null => {
    // Check custom replacement function first
    if (replaceWhen) {
      const replacement = replaceWhen(point)
      if (replacement !== undefined) return replacement
    }

    // Check pattern-based replacements (most specific to least specific)
    if (replacePattern) {
      if (replacePattern.corners && isCorner(point, cols, rows)) {
        return replacePattern.corners
      }
      if (replacePattern.edges && isEdge(point, cols, rows)) {
        return replacePattern.edges
      }
      if (replacePattern.center && isCenter(point, cols, rows)) {
        return replacePattern.center
      }
    }

    // Return null to indicate default child should be used
    return null
  }

  // Check if children is a function or a React element
  const isRenderFunction = typeof children === "function"

  return (
    <>
      {points.map((point) => {
        // Determine which component to use (replacement or default)
        const replacementComponent = getComponentForPoint(point)

        if (replacementComponent) {
          // Has replacement component - clone and render with position
          const existingName = (replacementComponent.props as any)?.name || ""
          const newName = existingName
            ? `${existingName}${point.index}`
            : `grid_item_${point.index}`

          return (
            <group key={point.index} pcbX={point.x} pcbY={point.y}>
              {React.cloneElement(
                replacementComponent as React.ReactElement<any>,
                {
                  gridIndex: point.index,
                  gridRow: point.row,
                  gridCol: point.col,
                  name: newName,
                },
              )}
            </group>
          )
        } else if (isRenderFunction) {
          // No replacement, use render function API
          return (
            <React.Fragment key={point.index}>{children(point)}</React.Fragment>
          )
        } else {
          // No replacement, use default element child
          const childElement = children as React.ReactElement<any>
          const existingName = childElement.props?.name || ""
          const newName = existingName
            ? `${existingName}${point.index}`
            : `grid_item_${point.index}`

          return (
            <group key={point.index} pcbX={point.x} pcbY={point.y}>
              {React.cloneElement(childElement, {
                gridIndex: point.index,
                gridRow: point.row,
                gridCol: point.col,
                name: newName,
              })}
            </group>
          )
        }
      })}
    </>
  )
}

// Usage examples:
//
// Simple API (new) - component automatically clones children and injects props:
// Default behavior: starts at bottom-left (BL), Row 0 = bottom
// <ArrayGrid cols={5} rows={3} spacingX={20} spacingY={15} startX={100} startY={50}>
//   <Pin name="pin" />
// </ArrayGrid>
// Result: Creates pins starting from bottom-left, going right then up
// Creates names: "pin_0" (bottom-left), "pin_1", ... "pin_14" (top-right)
// Props injected: pcbX, pcbY, gridIndex, gridRow, gridCol, name
//
// With startIndex to begin counting from 1:
// <ArrayGrid cols={3} rows={3} spacingX={10} spacingY={10} startX={20} startY={20} startIndex={1}>
//   <Pin name="pin" />
// </ArrayGrid>
// Result: Creates "pin_1" (bottom-left), "pin_2", ... "pin_9" (top-right)
//
// Change iteration start corner (e.g., top-left):
// <ArrayGrid cols={3} rows={3} spacingX={10} spacingY={10} startX={20} startY={20} startCorner="TL">
//   <Pin name="pin" />
// </ArrayGrid>
// Result: Index 0 starts at top-left instead of bottom-left
//
// Render function API (original) - full control over rendering:
// <ArrayGrid cols={5} rows={3} spacingX={20} spacingY={15} startX={200} startY={100}>
//   {(point) => <div>Row {point.row}, Col {point.col} at ({point.x}, {point.y})</div>}
// </ArrayGrid>
