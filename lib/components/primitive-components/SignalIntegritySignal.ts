import { getSignalIntegrityBlocks } from "lib/utils/simulation/get-signal-integrity-blocks"
import { signalIntegritySignalProps } from "@tscircuit/props"
import type { SimulationSignal } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** One driven or quiet signal, rendered by its containing SI block. */
export class SignalIntegritySignal extends PrimitiveComponent<
  typeof signalIntegritySignalProps
> {
  simulation_signal_id: SimulationSignal["simulation_signal_id"] | null = null

  restoredEndpoints?: Pick<SimulationSignal, "driver" | "receivers">

  get config() {
    return {
      componentName: "SignalIntegritySignal",
      zodProps: signalIntegritySignalProps,
    }
  }

  doInitialSourceDesignRuleChecks(): void {
    if (this.parent?.componentName !== "SignalIntegritySimulation")
      throw new Error(
        "<signalintegrity.signal> must be inside <signalintegrity.simulation>.",
      )
    this.onPropsChange()
  }

  onPropsChange(): void {
    for (const block of getSignalIntegrityBlocks(this._getBoard()))
      block._markDirty("PcbSimulationRender")
    this.parent?._markDirty("PcbSimulationRender")
  }

  removePcbSimulationRender(): void {
    if (this.simulation_signal_id)
      this.root!.db.simulation_signal.delete(this.simulation_signal_id)
    this.simulation_signal_id = null
    this.onPropsChange()
  }
}
