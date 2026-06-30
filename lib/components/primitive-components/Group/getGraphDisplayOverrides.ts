import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"
import type { Ammeter } from "../../normal-components/Ammeter"
import type { VoltageProbe } from "../VoltageProbe"
import type { GraphDisplayOverrides } from "./GraphDisplayOverrides"

export const getVoltageProbeGraphDisplayOverrides = (
  probe: VoltageProbe,
): GraphDisplayOverrides => {
  const {
    graphDisplayName,
    graphCenter,
    graphVerticalOffset,
    graphVoltagePerDiv,
  } = probe._parsedProps

  return {
    displayName: graphDisplayName,
    color: probe.color ?? undefined,
    center: graphCenter,
    verticalOffset: parseSimulationGraphValue(graphVerticalOffset),
    valuePerDiv: parseSimulationGraphValue(graphVoltagePerDiv),
  }
}

export const getAmmeterGraphDisplayOverrides = (
  ammeter: Ammeter,
): GraphDisplayOverrides => {
  const {
    color,
    graphDisplayName,
    graphCenter,
    graphVerticalOffset,
    graphCurrentPerDiv,
  } = ammeter._parsedProps

  return {
    displayName: graphDisplayName,
    color,
    center: graphCenter,
    verticalOffset: parseSimulationGraphValue(graphVerticalOffset),
    valuePerDiv: parseSimulationGraphValue(graphCurrentPerDiv),
  }
}
