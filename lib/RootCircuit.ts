import type { PlatformConfig } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "./IsolatedCircuit"

export class RootCircuit extends IsolatedCircuit {
  override isRootCircuit = true

  constructor({
    platform,
    projectUrl,
    pcbPhaseSkewSampleSpacingMm,
  }: {
    platform?: PlatformConfig
    projectUrl?: string
    /** Opt in to storing planar phase-skew samples no farther apart than this many mm. */
    pcbPhaseSkewSampleSpacingMm?: number
  } = {}) {
    super({
      platform,
      projectUrl,
      pcbPhaseSkewSampleSpacingMm,
      cachedSubcircuits: new Map<string, AnyCircuitElement[]>(),
      pendingSubcircuitRenders: new Map<string, Promise<AnyCircuitElement[]>>(),
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
