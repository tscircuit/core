import type { Group } from "./Group"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import Debug from "debug"
import { getSpiceyEngine } from "../../../spice/get-spicey-engine"

const debug = Debug("tscircuit:core:Group_doInitialSimulationSpiceEngineRender")

export function Group_doInitialSimulationSpiceEngineRender(group: Group<any>) {
  // Only run spice simulation for subcircuits
  if (!group.isSubcircuit) return

  const { root } = group
  if (!root) return

  const analogSims = group.selectAll(".analogsimulation") as AnalogSimulation[]

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
    const spiceNetlist = circuitJsonToSpice(circuitJson)
    spiceString = spiceNetlist.toSpiceString()
    debug(`Generated SPICE string:\n${spiceString}`)
  } catch (error) {
    debug(`Failed to convert circuit JSON to SPICE: ${error}`)
    return
  }

  // Run simulation for each configured spice engine
  for (const [engineName, spiceEngine] of Object.entries(spiceEngineMap)) {
    debug(`Queueing simulation for spice engine: ${engineName}`)

    group._queueAsyncEffect(`spice-simulation-${engineName}`, async () => {
      try {
        debug(`Running simulation with engine: ${engineName}`)
        const result = await spiceEngine.simulate(spiceString)

        debug(
          `Simulation completed, received ${result.simulationResultCircuitJson.length} elements`,
        )

        // Add simulation results to the database
        for (const element of result.simulationResultCircuitJson) {
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
