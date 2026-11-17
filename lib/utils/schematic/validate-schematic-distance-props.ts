import { distance } from "circuit-json"

const OPTIONAL_SCHEMATIC_DISTANCE_PROPS = [
  "schX",
  "schY",
  "schWidth",
  "schHeight",
  "schMarginTop",
  "schMarginRight",
  "schMarginBottom",
  "schMarginLeft",
  "schMarginX",
  "schMarginY",
  "schPadding",
  "schPaddingLeft",
  "schPaddingRight",
  "schPaddingTop",
  "schPaddingBottom",
] as const

const COMPONENT_SCHEMATIC_DISTANCE_PROPS: Record<
  string,
  { optional?: readonly string[]; required?: readonly string[] }
> = {
  SchematicBox: {
    optional: [
      "width",
      "height",
      "padding",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom",
      "titleFontSize",
    ],
  },
  SchematicRect: {
    required: ["width", "height"],
    optional: ["strokeWidth"],
  },
  SchematicLine: {
    required: ["x1", "y1", "x2", "y2"],
    optional: ["strokeWidth", "dashLength", "dashGap"],
  },
  SchematicCircle: {
    required: ["radius"],
    optional: ["strokeWidth"],
  },
  SchematicArc: {
    required: ["radius"],
    optional: ["strokeWidth"],
  },
  SchematicTable: {
    optional: ["cellPadding", "borderWidth", "fontSize"],
  },
  Symbol: {
    optional: ["width", "height"],
  },
  Port: {
    optional: ["schStemLength"],
  },
}

const COMPONENTS_WITH_CENTER_POINT = new Set([
  "SchematicCircle",
  "SchematicArc",
])

/**
 * Returns true when a raw distance string looks like a calc(...) expression,
 * which is only supported on PCB coordinates and assembly mount rotations.
 */
export function isUnsupportedCalcExpression(rawValue: unknown): boolean {
  return (
    typeof rawValue === "string" &&
    (/^\s*calc\b/i.test(rawValue) || /\bcalc\s*\(/i.test(rawValue))
  )
}

function isInvalidSchematicDistance(
  rawValue: unknown,
  parsedValue: unknown,
): boolean {
  if (isUnsupportedCalcExpression(rawValue)) return true
  if (parsedValue === undefined) return false
  return typeof parsedValue !== "number" || !Number.isFinite(parsedValue)
}

/**
 * Builds a user-facing Circuit JSON validation message for an invalid
 * schematic coordinate or dimension prop.
 */
export function getInvalidSchematicDistanceErrorMessage(params: {
  propertyName: string
  componentDisplayName: string
  rawValue: unknown
}): string {
  const { propertyName, componentDisplayName, rawValue } = params
  if (isUnsupportedCalcExpression(rawValue)) {
    return `Invalid ${propertyName} value for ${componentDisplayName}: calc() expressions are not supported for ${propertyName}. expression="${rawValue}"`
  }
  return `Invalid ${propertyName} value for ${componentDisplayName}: "${String(rawValue)}" could not be parsed as a finite number.`
}

/**
 * Resolves a schematic coordinate prop into a finite number (or undefined when
 * omitted) so fallback components like ErrorPlaceholder never emit NaN centers.
 */
export function resolveSafeSchematicCoordinate(
  value: unknown,
): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    if (isUnsupportedCalcExpression(value)) return 0
    try {
      const parsed = distance.safeParse(value)
      if (parsed.success && Number.isFinite(parsed.data)) {
        return parsed.data
      }
    } catch {
      return 0
    }
    return 0
  }
  return 0
}

/**
 * Validates schematic distance/dimension props on `parsedProps` against
 * `rawProps`, sanitizing invalid/non-finite entries so NaN/Infinity values
 * never reach schematic layout or Circuit JSON output.
 */
export function collectAndSanitizeSchematicDistanceProps(params: {
  componentName: string
  rawProps: Record<string, any> | undefined
  parsedProps: Record<string, any> | undefined
}): {
  invalid: Array<[propertyName: string, rawValue: unknown]>
  valid: string[]
} {
  const { componentName, rawProps, parsedProps } = params
  const invalid: Array<[string, unknown]> = []
  const valid: string[] = []
  if (!parsedProps) return { invalid, valid }

  const componentConfig = COMPONENT_SCHEMATIC_DISTANCE_PROPS[componentName]
  const optionalProps: readonly string[] = componentConfig?.optional
    ? [...OPTIONAL_SCHEMATIC_DISTANCE_PROPS, ...componentConfig.optional]
    : OPTIONAL_SCHEMATIC_DISTANCE_PROPS
  const requiredProps = componentConfig?.required ?? []

  const checkProp = (propName: string, fallbackValue: number | undefined) => {
    const hasRawProp = rawProps ? propName in rawProps : false
    const hasParsedProp = propName in parsedProps
    if (!hasRawProp && !hasParsedProp) return

    const rawValue = hasRawProp ? rawProps![propName] : parsedProps[propName]
    const parsedValue = parsedProps[propName]

    if (rawValue === undefined && parsedValue === undefined) {
      if (hasRawProp) valid.push(propName)
      return
    }

    if (isInvalidSchematicDistance(rawValue, parsedValue)) {
      invalid.push([propName, rawValue])
      parsedProps[propName] = fallbackValue
    } else if (hasRawProp) {
      valid.push(propName)
    }
  }

  for (const propName of optionalProps) {
    checkProp(propName, undefined)
  }
  for (const propName of requiredProps) {
    checkProp(propName, 0)
  }

  if (COMPONENTS_WITH_CENTER_POINT.has(componentName)) {
    const rawCenter = rawProps?.center
    const parsedCenter = parsedProps.center
    if (parsedCenter && typeof parsedCenter === "object") {
      for (const axis of ["x", "y"] as const) {
        const rawAxis =
          rawCenter && typeof rawCenter === "object"
            ? rawCenter[axis]
            : undefined
        const parsedAxis = parsedCenter[axis]
        const propKey = `center.${axis}`
        if (rawAxis === undefined && parsedAxis === undefined) continue
        if (isInvalidSchematicDistance(rawAxis, parsedAxis)) {
          invalid.push([propKey, rawAxis ?? parsedAxis])
          parsedCenter[axis] = 0
        } else if (
          rawCenter &&
          typeof rawCenter === "object" &&
          axis in rawCenter
        ) {
          valid.push(propKey)
        }
      }
    }
  }

  if (componentName === "Symbol") {
    const rawViewbox = rawProps?.viewbox
    const parsedViewbox = parsedProps.viewbox
    if (parsedViewbox && typeof parsedViewbox === "object") {
      for (const key of ["minX", "maxX", "minY", "maxY"] as const) {
        const rawBound =
          rawViewbox && typeof rawViewbox === "object"
            ? rawViewbox[key]
            : undefined
        const parsedBound = parsedViewbox[key]
        const propKey = `viewbox.${key}`
        if (isInvalidSchematicDistance(rawBound, parsedBound)) {
          invalid.push([propKey, rawBound ?? parsedBound])
          parsedProps.viewbox = undefined
        } else if (
          rawViewbox &&
          typeof rawViewbox === "object" &&
          key in rawViewbox
        ) {
          valid.push(propKey)
        }
      }
    }
  }

  return { invalid, valid }
}
