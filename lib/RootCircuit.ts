import type { PlatformConfig } from "@tscircuit/props"
import { IsolatedCircuit } from "./IsolatedCircuit"

export class RootCircuit extends IsolatedCircuit {
  override isRoot = true

  constructor({
    platform,
    projectUrl,
  }: { platform?: PlatformConfig; projectUrl?: string } = {}) {
    super({ platform, projectUrl })
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
