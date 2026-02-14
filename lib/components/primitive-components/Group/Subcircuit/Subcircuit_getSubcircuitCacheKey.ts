import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { ReactElement } from "react"
import { isValidElement } from "react"
import type { Subcircuit } from "./Subcircuit"

/** Object with a getPortSelector method, used in trace from/to props */
interface PortSelectorObject {
  getPortSelector: () => string
}

/** Type guard for objects with getPortSelector method */
function hasPortSelector(value: object): value is PortSelectorObject {
  return (
    "getPortSelector" in value &&
    typeof (value as PortSelectorObject).getPortSelector === "function"
  )
}

/**
 * Props that describe the external placement of a component and should be
 * excluded from the subcircuit cache key. Two subcircuits at different
 * positions but with identical internal structure should share a cache entry.
 */
const POSITIONAL_PROPS = new Set([
  "pcbX",
  "pcbY",
  "pcbOffsetX",
  "pcbOffsetY",
  "pcbRotation",
  "pcbLeftEdgeX",
  "pcbRightEdgeX",
  "pcbTopEdgeY",
  "pcbBottomEdgeY",
  "pcbPositionAnchor",
  "pcbPositionMode",
  "pcbAnchorAlignment",
  "pcbMarginTop",
  "pcbMarginRight",
  "pcbMarginBottom",
  "pcbMarginLeft",
  "pcbMarginX",
  "pcbMarginY",
  "layer",
  "schX",
  "schY",
  "schRotation",
  "schMarginTop",
  "schMarginRight",
  "schMarginBottom",
  "schMarginLeft",
  "schMarginX",
  "schMarginY",
  "relative",
  "pcbRelative",
  "schRelative",
])

/**
 * Props that should always be excluded from cache keys because they are
 * React internals, non-serializable, or are the caching flag itself.
 */
const ALWAYS_EXCLUDED_PROPS = new Set([
  "key",
  "children",
  "_subcircuitCachingEnabled",
])

/**
 * Props on the subcircuit itself that should be excluded from the cache
 * key (in addition to positional props). The subcircuit's own name and subcircuit
 * flag differ between instances but don't affect internal structure.
 */
const SUBCIRCUIT_EXCLUDED_PROPS = new Set(["name", "subcircuit"])

type SerializablePropValue =
  | string
  | number
  | boolean
  | null
  | SerializablePropValue[]
  | { [key: string]: SerializablePropValue }

/**
 * Sanitize a single prop value for JSON serialization.
 */
function sanitizePropValue(value: unknown): SerializablePropValue | undefined {
  if (typeof value === "function") return undefined
  if (isValidElement(value)) {
    const el = value as ReactElement<Record<string, unknown>>
    return {
      __reactElement: true,
      type: typeof el.type === "function" ? el.type.name : String(el.type),
      props: sanitizeProps(el.props),
    }
  }
  if (Array.isArray(value)) {
    return value
      .map(sanitizePropValue)
      .filter((v): v is SerializablePropValue => v !== undefined)
  }
  if (value !== null && typeof value === "object") {
    if (hasPortSelector(value)) {
      return value.getPortSelector()
    }
    const result: Record<string, SerializablePropValue> = {}
    for (const [k, v] of Object.entries(value)) {
      const sanitized = sanitizePropValue(v)
      if (sanitized !== undefined) {
        result[k] = sanitized
      }
    }
    return result
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }
  return undefined
}

/**
 * Build a sanitized, sorted props object for deterministic serialization.
 */
function sanitizeProps(
  props: Record<string, unknown>,
): Record<string, SerializablePropValue> {
  const result: Record<string, SerializablePropValue> = {}
  const keys = Object.keys(props).sort()
  for (const key of keys) {
    if (ALWAYS_EXCLUDED_PROPS.has(key)) continue
    if (POSITIONAL_PROPS.has(key)) continue
    const sanitized = sanitizePropValue(props[key])
    if (sanitized !== undefined) {
      result[key] = sanitized
    }
  }
  return result
}

interface SerializedComponent {
  type: string
  props: Record<string, SerializablePropValue>
  children: SerializedComponent[]
}

/**
 * Recursively serialize a component tree into a deterministic structure.
 */
function serializeComponentTree(
  children: PrimitiveComponent[],
): SerializedComponent[] {
  return children.map((child) => ({
    type: child.componentName,
    props: sanitizeProps(child.props),
    children: serializeComponentTree(child.children),
  }))
}

/**
 * Compute a deterministic cache key for a subcircuit's internal structure.
 *
 * The key is based on:
 * - The subcircuit's own structural props (excluding positional props)
 * - The full children tree (component types, their props, nested children)
 *
 * Two subcircuits at different positions with the same internal structure
 * will produce the same cache key.
 */
export function getSubcircuitCacheKey(subcircuit: Subcircuit): string {
  const subcircuitProps: Record<string, SerializablePropValue> = {}
  const entries = Object.entries(subcircuit.props).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  for (const [key, value] of entries) {
    if (ALWAYS_EXCLUDED_PROPS.has(key)) continue
    if (POSITIONAL_PROPS.has(key)) continue
    if (SUBCIRCUIT_EXCLUDED_PROPS.has(key)) continue
    const sanitized = sanitizePropValue(value)
    if (sanitized !== undefined) {
      subcircuitProps[key] = sanitized
    }
  }

  const tree = {
    subcircuitProps,
    children: serializeComponentTree(subcircuit.children),
  }

  return JSON.stringify(tree)
}
