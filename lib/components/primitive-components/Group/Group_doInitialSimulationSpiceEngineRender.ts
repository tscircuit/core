import type { AnyCircuitElement, SimulationCurrentProbe } from "circuit-json"
import Debug from "debug"
import { getTransientVoltageGraphNamesFromSpiceNetlist } from "lib/utils/simulation/get-transient-voltage-graph-names-from-spice-netlist"
import { resetSimulationColorState } from "lib/utils/simulation/getSimulationColorForId"
import { getSpiceyEngine } from "../../../spice/get-spicey-engine"
import type { Ammeter } from "../../normal-components/Ammeter"
import type { AnalogAcSweepSimulation } from "../AnalogAcSweepSimulation"
import type { AnalogDcOperatingPointSimulation } from "../AnalogDcOperatingPointSimulation"
import type { AnalogDcSweepSimulation } from "../AnalogDcSweepSimulation"
import type { AnalogSimulation } from "../AnalogSimulation"
import type { AnalogTransientSimulation } from "../AnalogTransientSimulation"
import type { VoltageProbe } from "../VoltageProbe"
import type { GraphDisplayOverrides } from "./GraphDisplayOverrides"
import type { Group } from "./Group"
import type { InsertedSimulationGraph } from "./InsertedSimulationGraph"
import { attachSweepPointToSimulationResult } from "./attachSweepPointToSimulationResult"
import { createSimulationRuns } from "./createSimulationRuns"
import {
  getAmmeterGraphDisplayOverrides,
  getVoltageProbeGraphDisplayOverrides,
} from "./getGraphDisplayOverrides"
import { insertIndependentAxisScopeTraces } from "./insertIndependentAxisScopeTraces"
import { isCircuitElementInput } from "./isCircuitElementInput"
import { isCurrentGraph } from "./isCurrentGraph"
import { isSimulationCurrentResult } from "./isSimulationCurrentResult"
import { isSimulationVoltageResult } from "./isSimulationVoltageResult"
import { isVoltageGraph } from "./isVoltageGraph"

type AnalogSimulationComponent =
  | AnalogSimulation
  | AnalogTransientSimulation
  | AnalogDcOperatingPointSimulation
  | AnalogDcSweepSimulation
  | AnalogAcSweepSimulation

const debug = Debug("tscircuit:core:Group_doInitialSimulationSpiceEngineRender")

const getCircuitJsonForAnalogSimulation = ({
  circuitJson,
  simulationExperimentId,
  voltageProbes,
  ammeters,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: string
  voltageProbes: VoltageProbe[]
  ammeters: Ammeter[]
}) => {
  const voltageProbeIds = new Set(
    voltageProbes
      .map((probe) => probe.simulation_voltage_probe_id)
      .filter((id): id is string => Boolean(id)),
  )
  const currentProbeIds = new Set(
    ammeters
      .map((ammeter) => ammeter.simulation_current_probe_id)
      .filter((id): id is string => Boolean(id)),
  )
  const parameterSweepIds = new Set(
    circuitJson
      .filter(
        (
          element,
        ): element is Extract<
          AnyCircuitElement,
          { type: "simulation_parameter_sweep" }
        > =>
          element.type === "simulation_parameter_sweep" &&
          element.simulation_experiment_id === simulationExperimentId,
      )
      .map((parameterSweep) => parameterSweep.simulation_parameter_sweep_id),
  )

  return circuitJson.filter((element) => {
    if (element.type === "simulation_experiment") {
      return element.simulation_experiment_id === simulationExperimentId
    }
    if (element.type === "simulation_voltage_probe") {
      return voltageProbeIds.has(element.simulation_voltage_probe_id)
    }
    if (element.type === "simulation_current_probe") {
      return currentProbeIds.has(element.simulation_current_probe_id)
    }
    if (element.type === "simulation_parameter_sweep") {
      return element.simulation_experiment_id === simulationExperimentId
    }
    if (element.type === "simulation_parameter_sweep_point") {
      return parameterSweepIds.has(element.simulation_parameter_sweep_id)
    }
    if (element.type === "simulation_oscilloscope_trace") {
      if (element.simulation_voltage_probe_id) {
        return voltageProbeIds.has(element.simulation_voltage_probe_id)
      }
      if (element.simulation_current_probe_id) {
        return currentProbeIds.has(element.simulation_current_probe_id)
      }
    }
    if (
      element.type === "simulation_transient_voltage_graph" ||
      element.type === "simulation_transient_current_graph" ||
      element.type === "simulation_dc_operating_point_voltage" ||
      element.type === "simulation_dc_operating_point_current" ||
      element.type === "simulation_dc_sweep_voltage_graph" ||
      element.type === "simulation_dc_sweep_current_graph" ||
      element.type === "simulation_ac_sweep_voltage_graph" ||
      element.type === "simulation_ac_sweep_current_graph" ||
      element.type === "simulation_unknown_experiment_error"
    ) {
      return false
    }
    return true
  })
}

export function Group_doInitialSimulationSpiceEngineRender(group: Group<any>) {
  // Only run spice simulation for subcircuits
  if (!group.isSubcircuit) return

  const { root } = group
  if (!root) return

  const analogSims: AnalogSimulationComponent[] = [
    ...group.selectAll<AnalogSimulation>("analogsimulation"),
    ...group.selectAll<AnalogTransientSimulation>("analogtransientsimulation"),
    ...group.selectAll<AnalogDcOperatingPointSimulation>(
      "analogdcoperatingpointsimulation",
    ),
    ...group.selectAll<AnalogDcSweepSimulation>("analogdcsweepsimulation"),
    ...group.selectAll<AnalogAcSweepSimulation>("analogacsweepsimulation"),
  ]

  if (analogSims.length === 0) return

  resetSimulationColorState()

  // Check if there are any spice engines configured, or use default
  const spiceEngineMap = { ...root.platform?.spiceEngineMap }
  if (!spiceEngineMap.spicey) {
    spiceEngineMap.spicey = getSpiceyEngine()
  }

  // Run simulation for each analogsimulation component
  for (const analogSim of analogSims) {
    const simulationExperimentId = analogSim.simulation_experiment_id
    if (!simulationExperimentId) {
      debug("No simulation experiment id found, skipping simulation")
      continue
    }
    const simulationExperiment = root.db.simulation_experiment.get(
      simulationExperimentId,
    )
    if (!simulationExperiment) {
      debug("No simulation experiment found, skipping simulation")
      continue
    }

    const simulationScope = analogSim.getGroup() ?? group
    const voltageProbes =
      simulationScope.selectAll<VoltageProbe>("voltageprobe")
    const ammeters = simulationScope.selectAll<Ammeter>("ammeter")
    const circuitJson = getCircuitJsonForAnalogSimulation({
      circuitJson: root.db.toArray(),
      simulationExperimentId,
      voltageProbes,
      ammeters,
    })

    let simulationRuns: ReturnType<typeof createSimulationRuns>
    try {
      simulationRuns = createSimulationRuns({
        circuitJson,
        simulationExperimentId,
      })
      debug(
        `Generated ${simulationRuns.length} SPICE run(s):\n${simulationRuns
          .map((simulationRun) => simulationRun.spiceString)
          .join("\n")}`,
      )
    } catch (error) {
      debug(`Failed to convert circuit JSON to SPICE: ${error}`)
      root.db.simulation_unknown_experiment_error.insert({
        simulation_experiment_id: simulationExperimentId,
        error_type: "simulation_unknown_experiment_error",
        message: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    const graphNameToProbe = new Map<string, VoltageProbe>()
    const voltageProbesById = new Map<string, VoltageProbe>()
    const graphDisplayOverridesByProbeId = new Map<
      string,
      GraphDisplayOverrides
    >()
    for (const probe of voltageProbes) {
      if (probe.finalProbeName) {
        graphNameToProbe.set(probe.finalProbeName, probe)
      }
      if (probe.simulation_voltage_probe_id) {
        voltageProbesById.set(probe.simulation_voltage_probe_id, probe)
        graphDisplayOverridesByProbeId.set(
          probe.simulation_voltage_probe_id,
          getVoltageProbeGraphDisplayOverrides(probe),
        )
      }
    }

    for (const ammeter of ammeters) {
      if (ammeter.simulation_current_probe_id) {
        graphDisplayOverridesByProbeId.set(
          ammeter.simulation_current_probe_id,
          getAmmeterGraphDisplayOverrides(ammeter),
        )
      }
    }

    const scopedCurrentProbeIds = new Set(
      ammeters
        .map((ammeter) => ammeter.simulation_current_probe_id)
        .filter((id): id is string => Boolean(id)),
    )
    const currentProbesById = new Map<string, SimulationCurrentProbe>()
    const currentProbesByName = new Map<string, SimulationCurrentProbe>()
    for (const probe of root.db.simulation_current_probe
      .list()
      .filter((probe) =>
        scopedCurrentProbeIds.has(probe.simulation_current_probe_id),
      )) {
      currentProbesById.set(probe.simulation_current_probe_id, probe)
      if (probe.name !== undefined) {
        currentProbesByName.set(probe.name, probe)
      }
    }

    const orderedSimulationProbes = root.db.simulation_voltage_probe
      .list()
      .filter((probe) =>
        voltageProbesById.has(probe.simulation_voltage_probe_id),
      )
    const firstSpiceNetlist = simulationRuns[0]?.spiceNetlist
    const graphNamesFromNetlist = firstSpiceNetlist
      ? getTransientVoltageGraphNamesFromSpiceNetlist(firstSpiceNetlist)
      : []

    if (graphNamesFromNetlist.length === orderedSimulationProbes.length) {
      for (const [
        index,
        simulationProbe,
      ] of orderedSimulationProbes.entries()) {
        const probe = voltageProbesById.get(
          simulationProbe.simulation_voltage_probe_id,
        )
        const graphName = graphNamesFromNetlist[index]
        if (probe && graphName) {
          graphNameToProbe.set(graphName, probe)
        }
      }
    } else {
      debug(
        `Skipping probe-to-graph order mapping because counts differ: probes=${orderedSimulationProbes.length} graphNames=${graphNamesFromNetlist.length}`,
      )
    }

    const engineName = analogSim.getSpiceEngineName() ?? "spicey"
    const spiceEngine = spiceEngineMap[engineName]

    if (!spiceEngine) {
      throw new Error(
        `SPICE engine "${engineName}" not found in platform config. Available engines: ${JSON.stringify(
          Object.keys(spiceEngineMap).filter((k) => k !== "spicey"),
        )}`,
      )
    }

    const effectId = `spice-simulation-${engineName}-${simulationExperimentId}`

    debug(
      `Queueing simulation for spice engine: ${engineName} (id: ${effectId})`,
    )

    group._queueAsyncEffect(effectId, async () => {
      try {
        // Add simulation results to the database
        const insertedVoltageGraphs: InsertedSimulationGraph[] = []
        const insertedCurrentGraphs: InsertedSimulationGraph[] = []

        for (const simulationRun of simulationRuns) {
          debug(`Running simulation with engine: ${engineName}`)
          const result = await spiceEngine.simulate(simulationRun.spiceString)

          debug(
            `Simulation completed, received ${result.simulationResultCircuitJson.length} elements`,
          )

          for (const rawElement of result.simulationResultCircuitJson) {
            if (!isCircuitElementInput(rawElement)) {
              debug("Skipping invalid simulation result element")
              continue
            }

            const element = attachSweepPointToSimulationResult({
              simulationResult: rawElement,
              simulationParameterSweepPointId:
                simulationRun.simulationParameterSweepPointId,
            })

            if (isVoltageGraph(element)) {
              element.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id

              const probeMatch = element.name
                ? graphNameToProbe.get(element.name)
                : undefined
              if (probeMatch) {
                element.color = probeMatch.color ?? undefined
                element.source_probe_id =
                  probeMatch.simulation_voltage_probe_id ?? undefined
              }
            } else if (isSimulationVoltageResult(element)) {
              element.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id
              const probeMatch =
                voltageProbesById.get(element.simulation_voltage_probe_id) ??
                (element.name ? graphNameToProbe.get(element.name) : undefined)
              if (probeMatch?.simulation_voltage_probe_id) {
                element.color = probeMatch.color ?? undefined
                element.simulation_voltage_probe_id =
                  probeMatch.simulation_voltage_probe_id
              }
            }

            if (isCurrentGraph(element)) {
              element.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id

              const probeMatch =
                (element.source_probe_id
                  ? currentProbesById.get(element.source_probe_id)
                  : undefined) ??
                (element.name
                  ? currentProbesByName.get(element.name)
                  : undefined)
              if (probeMatch) {
                element.color = probeMatch.color
                element.source_probe_id = probeMatch.simulation_current_probe_id
              }
            } else if (isSimulationCurrentResult(element)) {
              element.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id
              const probeMatch =
                currentProbesById.get(element.simulation_current_probe_id) ??
                (element.name
                  ? currentProbesByName.get(element.name)
                  : undefined)
              if (probeMatch) {
                element.color = probeMatch.color
                element.simulation_current_probe_id =
                  probeMatch.simulation_current_probe_id
              }
            }

            const insertedElement = root.db.insert(element)
            if (isVoltageGraph(insertedElement)) {
              insertedVoltageGraphs.push({
                type: "voltage",
                graph: insertedElement,
              })
            }
            if (isCurrentGraph(insertedElement)) {
              insertedCurrentGraphs.push({
                type: "current",
                graph: insertedElement,
              })
            }
            debug(`Inserted ${element.type} into database`)
          }
        }

        if (analogSim.usesIndependentGraphAxes()) {
          insertIndependentAxisScopeTraces({
            db: root.db,
            graphs: [...insertedVoltageGraphs, ...insertedCurrentGraphs],
            graphDisplayOverridesByProbeId,
          })
        }

        // Mark the component as dirty to trigger re-render if needed
        group._markDirty("SimulationSpiceEngineRender")
      } catch (error) {
        debug(`Simulation failed for engine ${engineName}: ${error}`)
        root.db.simulation_unknown_experiment_error.insert({
          simulation_experiment_id: simulationExperimentId,
          error_type: "simulation_unknown_experiment_error",
          message: error instanceof Error ? error.message : String(error),
        })
        // Don't throw - allow other engines to continue
      }
    })
  }
}
