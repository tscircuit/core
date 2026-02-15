import type { PlatformConfig } from "@tscircuit/props"
import { IsolatedCircuit } from "./IsolatedCircuit"
import type { AnyCircuitElement } from "circuit-json"

export class RootCircuit extends IsolatedCircuit {
  override isRootCircuit = true

  constructor({
    platform,
    projectUrl,
  }: { platform?: PlatformConfig; projectUrl?: string } = {}) {
    super({ platform, projectUrl })
    // TODO rename to rootCircuit
    this.root = this
  }

  /**
   * Global cache for isolated subcircuit circuit JSON, keyed by prop hash.
   * When a subcircuit with _subcircuitCachingEnabled is rendered, the result
   * is stored here. Subsequent subcircuits with the same prop hash will reuse
   * the cached circuit JSON instead of re-rendering.
   */
  cachedSubcircuits: Map<string, AnyCircuitElement[]> = new Map()
}

/**
 * @deprecated
 */
export const Project = RootCircuit

/**
 * We currently don't make a distinction between RootCircuit and Circuit, but
 * we may in the future allow subcircuits to be created as new Circuit then
 * incorporated into a larger RootCircuit
 */
export const Circuit = RootCircuit

export { resolveStaticFileImport } from "./utils/resolveStaticFileImport"
