import { pcbTransientChannelSimulationProps } from "@tscircuit/props"
import type { SimulationPcbTransientChannelSimulation } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { PcbTransientChannelSimulation_doInitialPcbSimulationRender } from "./PcbTransientChannelSimulation_doInitialPcbSimulationRender"
import { getSignalIntegrityEyes } from "lib/utils/simulation/get-signal-integrity-blocks"

/** Declares a coupled SI run; solvers consume its Circuit JSON separately. */
export class PcbTransientChannelSimulation extends PrimitiveComponent<
  typeof pcbTransientChannelSimulationProps
> {
  simulation_pcb_transient_channel_simulation_id:
    | SimulationPcbTransientChannelSimulation["simulation_pcb_transient_channel_simulation_id"]
    | null = null
  get config() {
    return {
      componentName: "PcbTransientChannelSimulation",
      zodProps: pcbTransientChannelSimulationProps,
    }
  }

  onPropsChange(): void {
    this._markDirty("PcbSimulationRender")
  }

  doInitialPcbSimulationRender(): void {
    if (this.parent?.componentName !== "Board")
      throw new Error(
        "<simulation.pcbtransientchannelsimulation> must be a direct child of <board>",
      )
    if (this.getInheritedProperty("analogSimulationDisabled")) return
    PcbTransientChannelSimulation_doInitialPcbSimulationRender(this)
    this.markEyesDirty()
  }

  updatePcbSimulationRender(): void {
    this.doInitialPcbSimulationRender()
  }

  removePcbSimulationRender(): void {
    if (!this.simulation_pcb_transient_channel_simulation_id) return
    const { db } = this.root!
    for (const signal of db.simulation_pcb_driver_receiver_channel.list({
      simulation_pcb_transient_channel_simulation_id:
        this.simulation_pcb_transient_channel_simulation_id,
    }))
      db.simulation_pcb_driver_receiver_channel.delete(
        signal.simulation_pcb_driver_receiver_channel_id,
      )
    db.simulation_pcb_transient_channel_simulation.delete(
      this.simulation_pcb_transient_channel_simulation_id,
    )
    this.simulation_pcb_transient_channel_simulation_id = null
    this.markEyesDirty()
  }

  private markEyesDirty(): void {
    for (const eye of getSignalIntegrityEyes(this._getBoard()))
      eye._markDirty("SimulationSpiceEngineRender")
  }
}
