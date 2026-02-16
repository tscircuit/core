import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Group } from "./Group"
import type { Subcircuit } from "./Subcircuit/Subcircuit"

/**
 * Props that should be excluded from the hash because they vary per instance
 * (position/identity props) but don't affect the internal structure of the
 * subcircuit.
 */
const EXCLUDED_PROPS = new Set([
  "name",
  "key",
  "pcbX",
  "pcbY",
  "schX",
  "schY",
  "pcbLeftEdgeX",
  "pcbRightEdgeX",
  "pcbTopEdgeY",
  "pcbBottomEdgeY",
  "pcbRotation",
  "schRotation",
])

/**
 * Filter props to only include those that affect rendering output.
 * Excludes position/identity props and undefined values.
 */
function getHashableProps(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  const keys = Object.keys(props).sort()
  for (const key of keys) {
    if (!EXCLUDED_PROPS.has(key) && props[key] !== undefined) {
      result[key] = props[key]
    }
  }
  return result
}

/**
 * Recursively collect hashable data from children.
 */
function getChildrenHashData(children: PrimitiveComponent[]): any[] {
  return children.map((child) => ({
    componentName: child.componentName,
    props: getHashableProps(child.props ?? {}),
    children: getChildrenHashData(child.children),
  }))
}

/**
 * FNV-1a hash function - better distribution than djb2 for similar strings.
 * Uses 32-bit FNV-1a which provides good collision resistance for our use case.
 */
function fnv1aHash(str: string): number {
  let hash = 2166136261 // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }
  return hash >>> 0
}

/**
 * Compute a hash string from the input, using multiple hash rounds
 * for better collision resistance with hundreds of subcircuits.
 */
function computeHash(data: any): string {
  const jsonString = JSON.stringify(data)

  // Use FNV-1a with different seeds combined for better distribution
  const hash1 = fnv1aHash(jsonString)
  const hash2 = fnv1aHash(jsonString + hash1.toString())

  // Combine into a 16-character hex string
  return (
    hash1.toString(16).padStart(8, "0") + hash2.toString(16).padStart(8, "0")
  )
}

/**
 * Computes a hash of the subcircuit's props and children props.
 * This hash is used as the cache key for isolated subcircuit rendering.
 * Position/identity props are excluded so that identical subcircuits
 * placed at different locations will share the same hash.
 */
export function Subcircuit_getSubcircuitPropHash(
  subcircuit: Subcircuit,
): string {
  const hashableData = {
    props: getHashableProps(subcircuit.props ?? {}),
    children: getChildrenHashData(subcircuit.children),
  }

  return computeHash(hashableData)
}
