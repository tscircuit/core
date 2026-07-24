import type {
  AnyCircuitElement,
  SimulationCurrentProbe,
  SimulationExperiment,
  SimulationParameterSweep,
  SimulationVoltageProbe,
} from "circuit-json"
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
type SimulationGraphName = NonNullable<
  SimulationVoltageProbe["name"] | SimulationCurrentProbe["name"]
>
type SimulationVoltageProbeId =
  SimulationVoltageProbe["simulation_voltage_probe_id"]
type SimulationCurrentProbeId =
  SimulationCurrentProbe["simulation_current_probe_id"]
type SimulationExperimentId = SimulationExperiment["simulation_experiment_id"]
type SimulationParameterSweepId =
  SimulationParameterSweep["simulation_parameter_sweep_id"]
type SimulationProbeId = SimulationVoltageProbeId | SimulationCurrentProbeId
type VoltageProbeByGraphName = Map<SimulationGraphName, VoltageProbe>
type VoltageProbeById = Map<SimulationVoltageProbeId, VoltageProbe>
type GraphDisplayOverridesByProbeId = Map<
  SimulationProbeId,
  GraphDisplayOverrides
>
type SimulationCurrentProbeById = Map<
  SimulationCurrentProbeId,
  SimulationCurrentProbe
>
type SimulationCurrentProbeByName = Map<
  SimulationGraphName,
  SimulationCurrentProbe
>

const debug = Debug("tscircuit:core:Group_doInitialSimulationSpiceEngineRender")

const getCircuitJsonForAnalogSimulation = ({
  circuitJson,
  simulationExperimentId,
  voltageProbes,
  ammeters,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: SimulationExperimentId
  voltageProbes: VoltageProbe[]
  ammeters: Ammeter[]
}) => {
  const voltageProbeIds = new Set(
    voltageProbes
      .map((voltageProbe) => voltageProbe.simulation_voltage_probe_id)
      .filter(
        (
          simulationVoltageProbeId,
        ): simulationVoltageProbeId is SimulationVoltageProbeId =>
          Boolean(simulationVoltageProbeId),
      ),
  )
  const currentProbeIds = new Set(
    ammeters
      .map((ammeter) => ammeter.simulation_current_probe_id)
      .filter(
        (
          simulationCurrentProbeId,
        ): simulationCurrentProbeId is SimulationCurrentProbeId =>
          Boolean(simulationCurrentProbeId),
      ),
  )
  const parameterSweepIds: Set<SimulationParameterSweepId> = new Set(
    circuitJson
      .filter(
        (element): element is SimulationParameterSweep =>
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

  const analogSimulations: AnalogSimulationComponent[] = [
    ...group.selectAll<AnalogSimulation>("analogsimulation"),
    ...group.selectAll<AnalogTransientSimulation>("analogtransientsimulation"),
    ...group.selectAll<AnalogDcOperatingPointSimulation>(
      "analogdcoperatingpointsimulation",
    ),
    ...group.selectAll<AnalogDcSweepSimulation>("analogdcsweepsimulation"),
    ...group.selectAll<AnalogAcSweepSimulation>("analogacsweepsimulation"),
  ]

  if (analogSimulations.length === 0) return

  resetSimulationColorState()

  // Check if there are any spice engines configured, or use default
  const spiceEngineMap = { ...root.platform?.spiceEngineMap }
  if (!spiceEngineMap.spicey) {
    spiceEngineMap.spicey = getSpiceyEngine()
  }

  // Run simulation for each analogsimulation component
  for (const analogSimulation of analogSimulations) {
    const simulationExperimentId = analogSimulation.simulation_experiment_id
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

    const simulationScope = analogSimulation.getGroup() ?? group
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

    const voltageProbeByGraphName: VoltageProbeByGraphName = new Map()
    const voltageProbeById: VoltageProbeById = new Map()
    const graphDisplayOverridesByProbeId: GraphDisplayOverridesByProbeId =
      new Map()
    for (const probe of voltageProbes) {
      if (probe.finalProbeName) {
        voltageProbeByGraphName.set(probe.finalProbeName, probe)
      }
      if (probe.simulation_voltage_probe_id) {
        voltageProbeById.set(probe.simulation_voltage_probe_id, probe)
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
        .filter(
          (
            simulationCurrentProbeId,
          ): simulationCurrentProbeId is SimulationCurrentProbeId =>
            Boolean(simulationCurrentProbeId),
        ),
    )
    const currentProbeById: SimulationCurrentProbeById = new Map()
    const currentProbeByName: SimulationCurrentProbeByName = new Map()
    for (const probe of root.db.simulation_current_probe
      .list()
      .filter((probe) =>
        scopedCurrentProbeIds.has(probe.simulation_current_probe_id),
      )) {
      currentProbeById.set(probe.simulation_current_probe_id, probe)
      if (probe.name !== undefined) {
        currentProbeByName.set(probe.name, probe)
      }
    }

    const orderedSimulationProbes = root.db.simulation_voltage_probe
      .list()
      .filter((probe) =>
        voltageProbeById.has(probe.simulation_voltage_probe_id),
      )
    const firstSpiceNetlist = simulationRuns[0]?.spiceNetlist
    const graphNamesFromNetlist = firstSpiceNetlist
      ? getTransientVoltageGraphNamesFromSpiceNetlist(firstSpiceNetlist)
      : []

    if (graphNamesFromNetlist.length === orderedSimulationProbes.length) {
      for (const [
        simulationProbeIndex,
        simulationProbe,
      ] of orderedSimulationProbes.entries()) {
        const probe = voltageProbeById.get(
          simulationProbe.simulation_voltage_probe_id,
        )
        const graphName = graphNamesFromNetlist[simulationProbeIndex]
        if (probe && graphName) {
          voltageProbeByGraphName.set(graphName, probe)
        }
      }
    } else {
      debug(
        `Skipping probe-to-graph order mapping because counts differ: probes=${orderedSimulationProbes.length} graphNames=${graphNamesFromNetlist.length}`,
      )
    }

    const engineName = analogSimulation.getSpiceEngineName() ?? "spicey"
    const spiceEngine = spiceEngineMap[engineName]

    if (!spiceEngine) {
      throw new Error(
        `SPICE engine "${engineName}" not found in platform config. Available engines: ${JSON.stringify(
          Object.keys(spiceEngineMap).filter(
            (spiceEngineName) => spiceEngineName !== "spicey",
          ),
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
          const simulationResult = await spiceEngine.simulate(
            simulationRun.spiceString,
          )

          debug(
            `Simulation completed, received ${simulationResult.simulationResultCircuitJson.length} elements`,
          )

          for (const simulationResultCircuitElement of simulationResult.simulationResultCircuitJson) {
            if (!isCircuitElementInput(simulationResultCircuitElement)) {
              debug("Skipping invalid simulation result element")
              continue
            }

            const simulationResultWithSweepPoint =
              attachSweepPointToSimulationResult({
                simulationResult: simulationResultCircuitElement,
                simulationParameterSweepPointId:
                  simulationRun.simulationParameterSweepPointId,
              })

            if (isVoltageGraph(simulationResultWithSweepPoint)) {
              simulationResultWithSweepPoint.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id

              const probeMatch = simulationResultWithSweepPoint.name
                ? voltageProbeByGraphName.get(
                    simulationResultWithSweepPoint.name,
                  )
                : undefined
              if (probeMatch) {
                simulationResultWithSweepPoint.color =
                  probeMatch.color ?? undefined
                simulationResultWithSweepPoint.source_probe_id =
                  probeMatch.simulation_voltage_probe_id ?? undefined
              }
            } else if (
              isSimulationVoltageResult(simulationResultWithSweepPoint)
            ) {
              simulationResultWithSweepPoint.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id
              const probeMatch =
                voltageProbeById.get(
                  simulationResultWithSweepPoint.simulation_voltage_probe_id,
                ) ??
                (simulationResultWithSweepPoint.name
                  ? voltageProbeByGraphName.get(
                      simulationResultWithSweepPoint.name,
                    )
                  : undefined)
              if (probeMatch?.simulation_voltage_probe_id) {
                simulationResultWithSweepPoint.color =
                  probeMatch.color ?? undefined
                simulationResultWithSweepPoint.simulation_voltage_probe_id =
                  probeMatch.simulation_voltage_probe_id
              }
            }

            if (isCurrentGraph(simulationResultWithSweepPoint)) {
              simulationResultWithSweepPoint.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id

              const probeMatch =
                (simulationResultWithSweepPoint.source_probe_id
                  ? currentProbeById.get(
                      simulationResultWithSweepPoint.source_probe_id,
                    )
                  : undefined) ??
                (simulationResultWithSweepPoint.name
                  ? currentProbeByName.get(simulationResultWithSweepPoint.name)
                  : undefined)
              if (probeMatch) {
                simulationResultWithSweepPoint.color = probeMatch.color
                simulationResultWithSweepPoint.source_probe_id =
                  probeMatch.simulation_current_probe_id
              }
            } else if (
              isSimulationCurrentResult(simulationResultWithSweepPoint)
            ) {
              simulationResultWithSweepPoint.simulation_experiment_id =
                simulationExperiment.simulation_experiment_id
              const probeMatch =
                currentProbeById.get(
                  simulationResultWithSweepPoint.simulation_current_probe_id,
                ) ??
                (simulationResultWithSweepPoint.name
                  ? currentProbeByName.get(simulationResultWithSweepPoint.name)
                  : undefined)
              if (probeMatch) {
                simulationResultWithSweepPoint.color = probeMatch.color
                simulationResultWithSweepPoint.simulation_current_probe_id =
                  probeMatch.simulation_current_probe_id
              }
            }

            const insertedSimulationResult = root.db.insert(
              simulationResultWithSweepPoint,
            )
            if (isVoltageGraph(insertedSimulationResult)) {
              insertedVoltageGraphs.push({
                type: "voltage",
                graph: insertedSimulationResult,
              })
            }
            if (isCurrentGraph(insertedSimulationResult)) {
              insertedCurrentGraphs.push({
                type: "current",
                graph: insertedSimulationResult,
              })
            }
            debug(
              `Inserted ${simulationResultWithSweepPoint.type} into database`,
            )
          }
        }

        if (analogSimulation.usesIndependentGraphAxes()) {
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
