import { simulationIbisModelProps } from "@tscircuit/props"
import type { SimulationIbisModel as SimulationIbisModelRecord } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { SimulationIbisModel_getSimulationIbisModel } from "./SimulationIbisModel_getSimulationIbisModel"

type SimulationIbisModelId =
  SimulationIbisModelRecord["simulation_ibis_model_id"]

/** Declares a vendor source and physical pin mapping without fetching model files. */
export class SimulationIbisModel extends PrimitiveComponent<
  typeof simulationIbisModelProps
> {
  simulation_ibis_model_id: SimulationIbisModelId | null = null

  get config() {
    return {
      componentName: "SimulationIbisModel",
      zodProps: simulationIbisModelProps,
    }
  }

  onPropsChange(): void {
    this._markDirty("SimulationRender")
  }

  doInitialSimulationRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return

    const model = SimulationIbisModel_getSimulationIbisModel(this)
    if (this.simulation_ibis_model_id)
      this.root!.db.simulation_ibis_model.update(
        this.simulation_ibis_model_id,
        model,
      )
    else
      this.simulation_ibis_model_id =
        this.root!.db.simulation_ibis_model.insert(
          model,
        ).simulation_ibis_model_id
  }

  updateSimulationRender(): void {
    this.doInitialSimulationRender()
  }

  removeSimulationRender(): void {
    if (this.simulation_ibis_model_id)
      this.root!.db.simulation_ibis_model.delete(this.simulation_ibis_model_id)
    this.simulation_ibis_model_id = null
  }
}
