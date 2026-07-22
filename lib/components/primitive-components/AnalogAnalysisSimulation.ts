import type { SimulationExperiment } from "circuit-json"
import type { ZodType } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export abstract class AnalogAnalysisSimulation<
  PropsSchema extends ZodType,
> extends PrimitiveComponent<PropsSchema> {
  simulation_experiment_id: string | null = null

  protected abstract insertSimulationExperiment(): SimulationExperiment | null

  getSpiceEngineName(): string | undefined {
    return typeof this.props.spiceEngine === "string"
      ? this.props.spiceEngine
      : undefined
  }

  usesIndependentGraphAxes(): boolean {
    return this.props.graphIndependentAxes === true
  }

  getOrCreateSimulationExperiment(): SimulationExperiment | null {
    if (this.simulation_experiment_id) {
      return (
        this.root?.db.simulation_experiment.get(
          this.simulation_experiment_id,
        ) ?? null
      )
    }

    const sweepParameterCount = this.children.filter(
      (child) => child.componentName === "AnalogSweepParameter",
    ).length
    if (sweepParameterCount > 1) {
      this.renderError(
        "An analog simulation can contain at most one sweep parameter.",
      )
      return null
    }

    const simulationExperiment = this.insertSimulationExperiment()
    this.simulation_experiment_id =
      simulationExperiment?.simulation_experiment_id ?? null
    return simulationExperiment
  }

  doInitialSimulationRender(): void {
    this.getOrCreateSimulationExperiment()
  }
}
