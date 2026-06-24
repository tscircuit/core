import { SpiceNetlist, circuitJsonToSpice } from "circuit-json-to-spice"
import Debug from "debug"
import { getTransientVoltageGraphNamesFromSpiceNetlist } from "lib/utils/simulation/get-transient-voltage-graph-names-from-spice-netlist"
import { resetSimulationColorState } from "lib/utils/simulation/getSimulationColorForId"
import { getSpiceyEngine } from "../../../spice/get-spicey-engine"
import type { AnalogSimulation } from "../AnalogSimulation"
import type { VoltageProbe } from "../VoltageProbe"
import type { Group } from "./Group"

const debug = Debug("tscircuit:core:Group_doInitialSimulationSpiceEngineRender")

export function Group_doInitialSimulationSpiceEngineRender(group: Group<any>) {
  // Only run spice simulation for subcircuits
  if (!group.isSubcircuit) return

  const { root } = group
  if (!root) return

  const analogSims = group.selectAll("analogsimulation") as AnalogSimulation[]

  if (analogSims.length === 0) return

  const voltageProbes = group.selectAll("voltageprobe") as VoltageProbe[]

  resetSimulationColorState()

  // Check if there are any spice engines configured, or use default
  const spiceEngineMap = { ...root.platform?.spiceEngineMap }
  if (!spiceEngineMap.spicey) {
    spiceEngineMap.spicey = getSpiceyEngine()
  }

  // Get circuit JSON for this subcircuit
  const circuitJson = root.db.toArray()

  // Convert circuit JSON to SPICE string
  let spiceString: string
  let spiceNetlist: SpiceNetlist
  try {
    spiceNetlist = circuitJsonToSpice(circuitJson)
    spiceString = spiceNetlist.toSpiceString()
    debug(`Generated SPICE string:\n${spiceString}`)
  } catch (error) {
    debug(`Failed to convert circuit JSON to SPICE: ${error}`)
    return
  }

  const graphNameToProbe = new Map<string, VoltageProbe>()
  for (const probe of voltageProbes) {
    if (probe.finalProbeName) {
      graphNameToProbe.set(probe.finalProbeName, probe)
    }
  }

  const voltageProbesById = new Map(
    voltageProbes
      .filter((probe) => probe.simulation_voltage_probe_id)
      .map((probe) => [probe.simulation_voltage_probe_id!, probe] as const),
  )
  const currentProbesById = new Map(
    root.db.simulation_current_probe
      .list()
      .map((probe) => [probe.simulation_current_probe_id, probe] as const),
  )
  const currentProbesByName = new Map(
    root.db.simulation_current_probe
      .list()
      .filter((probe) => probe.name)
      .map((probe) => [probe.name!, probe] as const),
  )
  const orderedSimulationProbes = root.db.simulation_voltage_probe
    .list()
    .filter((probe) => voltageProbesById.has(probe.simulation_voltage_probe_id))
  const graphNamesFromNetlist =
    getTransientVoltageGraphNamesFromSpiceNetlist(spiceNetlist)

  if (graphNamesFromNetlist.length === orderedSimulationProbes.length) {
    for (const [index, simulationProbe] of orderedSimulationProbes.entries()) {
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

  // Run simulation for each analogsimulation component
  for (const analogSim of analogSims) {
    const engineName = analogSim._parsedProps.spiceEngine ?? "spicey"
    const spiceEngine = spiceEngineMap[engineName]

    if (!spiceEngine) {
      throw new Error(
        `SPICE engine "${engineName}" not found in platform config. Available engines: ${JSON.stringify(
          Object.keys(spiceEngineMap).filter((k) => k !== "spicey"),
        )}`,
      )
    }

    const effectId = `spice-simulation-${engineName}-${analogSim.source_component_id}`

    debug(
      `Queueing simulation for spice engine: ${engineName} (id: ${effectId})`,
    )

    group._queueAsyncEffect(effectId, async () => {
      try {
        debug(`Running simulation with engine: ${engineName}`)
        const result = await spiceEngine.simulate(spiceString)

        debug(
          `Simulation completed, received ${result.simulationResultCircuitJson.length} elements`,
        )

        const simulationExperiment = root.db.simulation_experiment.list()[0]
        if (!simulationExperiment) {
          debug("No simulation experiment found, skipping result insertion")
          return
        }

        // Add simulation results to the database
        for (const element of result.simulationResultCircuitJson) {
          if (element.type === "simulation_transient_voltage_graph") {
            element.simulation_experiment_id =
              simulationExperiment.simulation_experiment_id

            const probeMatch = element.name
              ? graphNameToProbe.get(element.name)
              : undefined
            if (probeMatch) {
              element.color = probeMatch.color
              element.source_probe_id = probeMatch.simulation_voltage_probe_id
            }
          }

          if (element.type === "simulation_transient_current_graph") {
            element.simulation_experiment_id =
              simulationExperiment.simulation_experiment_id

            const probeMatch =
              (element.source_probe_id
                ? currentProbesById.get(element.source_probe_id)
                : undefined) ??
              (element.name ? currentProbesByName.get(element.name) : undefined)
            if (probeMatch) {
              element.color = probeMatch.color
              element.source_probe_id = probeMatch.simulation_current_probe_id
            }
          }

          // Insert the simulation result into the database
          const elementType = element.type
          if (elementType && (root.db as any)[elementType]) {
            ;(root.db as any)[elementType].insert(element)
            debug(`Inserted ${elementType} into database`)
          } else {
            debug(
              `Warning: Unknown element type ${elementType}, adding to raw db`,
            )
            // @ts-ignore - fallback for unknown types
            root.db._addElement(element)
          }
        }

        // Mark the component as dirty to trigger re-render if needed
        group._markDirty("SimulationSpiceEngineRender")
      } catch (error) {
        debug(`Simulation failed for engine ${engineName}: ${error}`)
        const simulationExperiment = root.db.simulation_experiment.list()[0]
        root.db.simulation_unknown_experiment_error.insert({
          simulation_experiment_id:
            simulationExperiment?.simulation_experiment_id,
          error_type: "simulation_unknown_experiment_error",
          message: error instanceof Error ? error.message : String(error),
        })
        // Don't throw - allow other engines to continue
      }
    })
  }
}
