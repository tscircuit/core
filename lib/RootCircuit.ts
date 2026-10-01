import type { PlatformConfig } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "./IsolatedCircuit"
import type { EffectFootprintLoadingOptions } from "./utils/footprint/effect-footprint-loader"

export type {
  EffectFootprintLoadingOptions,
  FootprintFetch,
} from "./utils/footprint/effect-footprint-loader"

export class RootCircuit extends IsolatedCircuit {
  override isRootCircuit = true

  constructor({
    platform,
    projectUrl,
    experimentalFootprintLoading,
  }: {
    platform?: PlatformConfig
    projectUrl?: string
    experimentalFootprintLoading?: EffectFootprintLoadingOptions
  } = {}) {
    super({
      platform,
      projectUrl,
      experimentalFootprintLoading,
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
