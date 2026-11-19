import { getSignalIntegrityBlocks } from "lib/utils/simulation/get-signal-integrity-blocks"
import { pcbDriverReceiverChannelProps } from "@tscircuit/props"
import type { SimulationPcbDriverReceiverChannel } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

/** One driven or quiet signal, rendered by its containing SI block. */
export class PcbDriverReceiverChannel extends PrimitiveComponent<
  typeof pcbDriverReceiverChannelProps
> {
  simulation_pcb_driver_receiver_channel_id:
    | SimulationPcbDriverReceiverChannel["simulation_pcb_driver_receiver_channel_id"]
    | null = null

  get config() {
    return {
      componentName: "PcbDriverReceiverChannel",
      zodProps: pcbDriverReceiverChannelProps,
    }
  }

  doInitialSourceDesignRuleChecks(): void {
    if (this.parent?.componentName !== "PcbTransientChannelSimulation")
      throw new Error(
        "<simulation.pcbdriverreceiverchannel> must be inside <simulation.pcbtransientchannelsimulation>.",
      )
    this.onPropsChange()
  }

  onPropsChange(): void {
    for (const block of getSignalIntegrityBlocks(this._getBoard()))
      block._markDirty("PcbSimulationRender")
    this.parent?._markDirty("PcbSimulationRender")
  }

  removePcbSimulationRender(): void {
    if (this.simulation_pcb_driver_receiver_channel_id)
      this.root!.db.simulation_pcb_driver_receiver_channel.delete(
        this.simulation_pcb_driver_receiver_channel_id,
      )
    this.simulation_pcb_driver_receiver_channel_id = null
    this.onPropsChange()
  }
}
