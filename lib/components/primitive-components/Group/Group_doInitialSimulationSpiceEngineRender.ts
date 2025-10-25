import type { Group } from "./Group"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import Debug from "debug"
import { getSpiceyEngine } from "../../../spice/get-spicey-engine"
import type { AnalogSimulation } from "../AnalogSimulation"

const debug = Debug("tscircuit:core:Group_doInitialSimulationSpiceEngineRender")

export function Group_doInitialSimulationSpiceEngineRender(group: Group<any>) {
  // Only run spice simulation for subcircuits
  if (!group.isSubcircuit) return

  const { root } = group
  if (!root) return

  const analogSims = group.selectAll("analogsimulation") as AnalogSimulation[]

  if (analogSims.length === 0) return

  // Check if there are any spice engines configured, or use default
  const spiceEngineMap = { ...root.platform?.spiceEngineMap }
  if (!spiceEngineMap.spicey) {
    spiceEngineMap.spicey = getSpiceyEngine()
  }

  // Get circuit JSON for this subcircuit
  const circuitJson = root.db.toArray()

  // Convert circuit JSON to SPICE string
  let spiceString: string
  try {
    const spiceNetlist = circuitJsonToSpice(circuitJson as any)
    spiceString = spiceNetlist.toSpiceString()
    debug(`Generated SPICE string:\n${spiceString}`)
  } catch (error) {
    debug(`Failed to convert circuit JSON to SPICE: ${error}`)
    return
  }

  // Run simulation for each analogsimulation component
  for (const analogSim of analogSims) {
    const engineName = analogSim._parsedProps.spiceEngine ?? "spicey"
    const engineToUse = spiceEngineMap[engineName]

    if (!engineToUse) {
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
        const result = await engineToUse.simulate(spiceString)

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
        // Don't throw - allow other engines to continue
      }
    })
  }
}
