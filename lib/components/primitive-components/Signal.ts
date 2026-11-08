import { signalProps } from "@tscircuit/props"
import type { SimulationSignal } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { SignalIntegrity } from "./SignalIntegrity"

/** One driven or quiet signal, rendered by its containing SI block. */
export class Signal extends PrimitiveComponent<typeof signalProps> {
  simulation_signal_id: SimulationSignal["simulation_signal_id"] | null = null

  get config() {
    return { componentName: "Signal", zodProps: signalProps }
  }

  doInitialSourceDesignRuleChecks(): void {
    if (this.parent?.componentName !== "SignalIntegrity")
      throw new Error("<signal> must be inside <signalintegrity>.")
  }

  onPropsChange(): void {
    this.parent?._markDirty("PcbSimulationRender")
  }

  removePcbSimulationRender(): void {
    if (this.simulation_signal_id)
      this.root!.db.simulation_signal.delete(this.simulation_signal_id)
    this.simulation_signal_id = null
    ;(this.parent as SignalIntegrity | null)?._markDirty("PcbSimulationRender")
  }
}
