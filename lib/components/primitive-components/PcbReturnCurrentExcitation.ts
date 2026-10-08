import { pcbReturnCurrentExcitationProps } from "@tscircuit/props"
import type { SimulationReturnCurrentExcitation } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { PcbReturnCurrentExcitation_doInitialPcbSimulationRender } from "./PcbReturnCurrentExcitation_doInitialPcbSimulationRender"

type SimulationReturnCurrentExcitationId =
  SimulationReturnCurrentExcitation["simulation_return_current_excitation_id"]

/** Resolves user-selected contacts after PCB routing and placement settle. */
export class PcbReturnCurrentExcitation extends PrimitiveComponent<
  typeof pcbReturnCurrentExcitationProps
> {
  simulation_return_current_excitation_id: SimulationReturnCurrentExcitationId | null =
    null

  get config() {
    return {
      componentName: "PcbReturnCurrentExcitation",
      zodProps: pcbReturnCurrentExcitationProps,
    }
  }

  doInitialPcbSimulationRender(): void {
    PcbReturnCurrentExcitation_doInitialPcbSimulationRender(this)
  }

  updatePcbSimulationRender(): void {
    this.removePcbSimulationRender()
    this.doInitialPcbSimulationRender()
  }

  removePcbSimulationRender(): void {
    if (!this.simulation_return_current_excitation_id) return
    this.root!.db.simulation_return_current_excitation.delete(
      this.simulation_return_current_excitation_id,
    )
    this.simulation_return_current_excitation_id = null
  }
}
