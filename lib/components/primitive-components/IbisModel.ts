import { ibisModelProps } from "@tscircuit/props"
import type { SimulationIbisModel } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { IbisModel_getSimulationIbisModel } from "./IbisModel_getSimulationIbisModel"

type SimulationIbisModelId = SimulationIbisModel["simulation_ibis_model_id"]

/** Declares a vendor source and physical pin mapping without fetching model files. */
export class IbisModel extends PrimitiveComponent<typeof ibisModelProps> {
  simulation_ibis_model_id: SimulationIbisModelId | null = null

  get config() {
    return { componentName: "IbisModel", zodProps: ibisModelProps }
  }

  doInitialSimulationRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return

    const model = IbisModel_getSimulationIbisModel(this)
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
