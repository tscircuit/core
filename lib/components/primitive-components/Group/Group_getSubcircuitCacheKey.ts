import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { ReactElement } from "react"
import { isValidElement } from "react"
import type { Group } from "./Group"

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
 * Sanitize a single prop value for JSON serialization.
 *
 * - Functions are omitted (returns undefined → JSON.stringify drops the key)
 * - ReactElements are recursively decomposed into {type, props}
 * - Everything else is returned as-is
 */
type SerializablePropValue =
  | string
  | number
  | boolean
  | null
  | SerializablePropValue[]
  | { [key: string]: SerializablePropValue }

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
    // Handle {getPortSelector: () => string} objects used in trace from/to
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
 * Strips positional and always-excluded props, sanitizes non-serializable
 * values, and sorts keys for determinism.
 */
function sanitizeProps(
  props: Record<string, unknown>,
  excludePositional = false,
): Record<string, SerializablePropValue> {
  const result: Record<string, SerializablePropValue> = {}
  const keys = Object.keys(props).sort()
  for (const key of keys) {
    if (ALWAYS_EXCLUDED_PROPS.has(key)) continue
    if (excludePositional && POSITIONAL_PROPS.has(key)) continue
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
 * Recursively serialize a component tree into a deterministic structure
 * suitable for JSON.stringify-based cache keying.
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
 * Props on the subcircuit group itself that should be excluded from the cache
 * key (in addition to positional props). The group's own name and subcircuit
 * flag differ between instances but don't affect internal structure.
 */
const GROUP_EXCLUDED_PROPS = new Set(["name", "subcircuit"])

/**
 * Compute a deterministic cache key for a subcircuit's internal structure.
 *
 * The key is based on:
 * - The subcircuit group's own structural props (excluding positional props,
 *   name, and _subcircuitCachingEnabled)
 * - The full children tree (component types, their props, nested children)
 *
 * Two subcircuits at different positions with the same internal structure
 * will produce the same cache key.
 */

export function getSubcircuitCacheKey(group: Group): string {
  const groupProps: Record<string, SerializablePropValue> = {}
  const entries = Object.entries(group.props).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  for (const [key, value] of entries) {
    if (ALWAYS_EXCLUDED_PROPS.has(key)) continue
    if (POSITIONAL_PROPS.has(key)) continue
    if (GROUP_EXCLUDED_PROPS.has(key)) continue
    const sanitized = sanitizePropValue(value)
    if (sanitized !== undefined) {
      groupProps[key] = sanitized
    }
  }

  const tree = {
    groupProps,
    children: serializeComponentTree(group.children),
  }

  return JSON.stringify(tree)
}
