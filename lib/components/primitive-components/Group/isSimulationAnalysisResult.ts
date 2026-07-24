import type {
  AnyCircuitElementInput,
  SimulationAnalysisResultInput,
} from "circuit-json"
import { isCurrentGraph } from "./isCurrentGraph"
import { isSimulationCurrentResult } from "./isSimulationCurrentResult"
import { isSimulationVoltageResult } from "./isSimulationVoltageResult"
import { isVoltageGraph } from "./isVoltageGraph"

export const isSimulationAnalysisResult = (
  circuitElement: AnyCircuitElementInput,
): circuitElement is SimulationAnalysisResultInput =>
  isVoltageGraph(circuitElement) ||
  isCurrentGraph(circuitElement) ||
  isSimulationVoltageResult(circuitElement) ||
  isSimulationCurrentResult(circuitElement)
