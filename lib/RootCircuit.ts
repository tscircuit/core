import type { PlatformConfig } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "./IsolatedCircuit"

export class RootCircuit extends IsolatedCircuit {
  override isRootCircuit = true

  constructor({
    platform,
    projectUrl,
  }: { platform?: PlatformConfig; projectUrl?: string } = {}) {
    super({
      platform,
      projectUrl,
      cachedSubcircuits: new Map<string, AnyCircuitElement[]>(),
    })
    // TODO rename to rootCircuit
    this.root = this
  }
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
