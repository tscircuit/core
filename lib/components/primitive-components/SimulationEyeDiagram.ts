import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { simulationEyeDiagramProps } from "@tscircuit/props"
import type { SimulationEyeDiagram as EyeDiagramRecord } from "circuit-json"
import { getSignalIntegrityBlocks } from "lib/utils/simulation/get-signal-integrity-blocks"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { SimulationEyeDiagram_getRecords } from "./SimulationEyeDiagram_getRecords"

type EyeDiagramId = EyeDiagramRecord["simulation_eye_diagram_id"]
type EyeDiagramTable = CircuitJsonUtilObjects["simulation_eye_diagram"]

function insertEyeDiagramRecord(
  eyes: EyeDiagramTable,
  record: Parameters<EyeDiagramTable["insert"]>[0],
  previousId: EyeDiagramId | undefined,
) {
  // An explicit undefined ID would overwrite the database's generated ID.
  if (!previousId) return eyes.insert(record)
  const recordWithId = { ...record, simulation_eye_diagram_id: previousId }
  return eyes.insert(recordWithId)
}

export class SimulationEyeDiagram extends PrimitiveComponent<
  typeof simulationEyeDiagramProps
> {
  private eyeDiagramIds: EyeDiagramId[] = []

  get config() {
    return {
      componentName: "SimulationEyeDiagram",
      zodProps: simulationEyeDiagramProps,
    }
  }

  doInitialSimulationSpiceEngineRender(): void {
    if (this.parent?.componentName !== "Board")
      throw new Error(
        "<simulation.eyediagram> must be a direct child of <board>",
      )
    if (this.getInheritedProperty("analogSimulationDisabled")) {
      this.removeSimulationSpiceEngineRender()
      return
    }
    const { name, simulationRef } = this._parsedProps
    const blocks = getSignalIntegrityBlocks(this._getBoard()).filter(
      (block) => block._parsedProps.name === simulationRef,
    )
    if (blocks.length !== 1)
      throw new Error(
        `Eye diagram "${name}" needs exactly one simulation named "${simulationRef}".`,
      )
    const [block] = blocks
    // The simulation marks its eye diagrams dirty after writing its record.
    const simulationId = block.simulation_pcb_transient_channel_simulation_id
    if (!simulationId) return

    const records = SimulationEyeDiagram_getRecords(this, simulationId)
    const previousIds = this.eyeDiagramIds
    this.removeSimulationSpiceEngineRender()
    const eyes = this.root!.db.simulation_eye_diagram
    this.eyeDiagramIds = records.map(
      (record, index) =>
        insertEyeDiagramRecord(eyes, record, previousIds[index])
          .simulation_eye_diagram_id,
    )
  }

  onPropsChange(): void {
    this._markDirty("SimulationSpiceEngineRender")
  }

  updateSimulationSpiceEngineRender(): void {
    this.doInitialSimulationSpiceEngineRender()
  }

  removeSimulationSpiceEngineRender(): void {
    for (const id of this.eyeDiagramIds)
      this.root!.db.simulation_eye_diagram.delete(id)
    this.eyeDiagramIds = []
  }
}
