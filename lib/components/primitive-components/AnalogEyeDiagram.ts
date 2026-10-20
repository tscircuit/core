import { analogEyeDiagramProps } from "@tscircuit/props"
import type { SimulationEyeDiagram } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogEyeDiagram_getSimulationEyeDiagram } from "./AnalogEyeDiagram_getSimulationEyeDiagram"

type SimulationEyeDiagramId = SimulationEyeDiagram["simulation_eye_diagram_id"]

export class AnalogEyeDiagram extends PrimitiveComponent<
  typeof analogEyeDiagramProps
> {
  simulation_eye_diagram_id: SimulationEyeDiagramId | null = null
  get config() {
    return {
      componentName: "AnalogEyeDiagram",
      zodProps: analogEyeDiagramProps,
    }
  }

  // Probes have finished SimulationRender before this phase, independent of JSX order.
  doInitialSimulationSpiceEngineRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return

    const eye = AnalogEyeDiagram_getSimulationEyeDiagram(this)
    if (this.simulation_eye_diagram_id)
      this.root!.db.simulation_eye_diagram.update(
        this.simulation_eye_diagram_id,
        eye,
      )
    else
      this.simulation_eye_diagram_id =
        this.root!.db.simulation_eye_diagram.insert(
          eye,
        ).simulation_eye_diagram_id
  }

  updateSimulationSpiceEngineRender(): void {
    this.doInitialSimulationSpiceEngineRender()
  }
  removeSimulationSpiceEngineRender(): void {
    if (this.simulation_eye_diagram_id)
      this.root!.db.simulation_eye_diagram.delete(
        this.simulation_eye_diagram_id,
      )
    this.simulation_eye_diagram_id = null
  }
}
