import { runAllAssemblyChecks } from "@tscircuit/checks"
import { isAssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import type { EnclosureFdmBox } from "./EnclosureFdmBox"
import { getReferencedEnclosureBoard } from "./get-referenced-enclosure-board"

/** Runs after all CAD records have rendered, including async CAD effects. Only
 * an enclosure in an assembly schedules model loading; ordinary PCB renders
 * incur no async effect, network requests or Manifold initialization here.
 */
export function EnclosureFdmBox_doInitialAssemblyDesignRuleChecks(
  enclosure: EnclosureFdmBox,
): void {
  enclosure.removeAssemblyDesignRuleChecks()
  const root = enclosure.root
  const geometry = enclosure.assemblyEnclosureGeometry
  if (!root || root.pcbDisabled || !geometry?.apertures.length) return
  let ancestor = enclosure.parent
  while (ancestor && !isAssemblyDeviceContainer(ancestor))
    ancestor = ancestor.parent
  if (!ancestor) return
  const board = getReferencedEnclosureBoard(
    enclosure,
    enclosure._parsedProps.boardRef,
  )
  if (
    root.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")
  )
    return
  const circuitJson = root.db.toArray()
  const run = enclosure._assemblyDrcRun
  enclosure._queueAsyncEffect("enclosure:aperture-drc", async () => {
    try {
      const { loadCadComponentMesh } = await import("circuit-json-to-gltf")
      const diagnostics = await runAllAssemblyChecks(circuitJson, {
        assemblyGeometry: {
          enclosures: [geometry],
          getCadComponentMesh: (cadComponent) =>
            loadCadComponentMesh(cadComponent, {
              pcbComponent: cadComponent.pcb_component_id
                ? (root.db.pcb_component.get(cadComponent.pcb_component_id) ??
                  undefined)
                : undefined,
              projectBaseUrl: root.projectUrl,
            }),
        },
      })
      // An edit/removal while a model fetch was pending invalidates this pass.
      if (run !== enclosure._assemblyDrcRun || enclosure.shouldBeRemoved) return
      // The database assigns canonical IDs on insertion. Retain those IDs so
      // an update/removal deletes the actual previously emitted records.
      enclosure._assemblyDrcDiagnostics = diagnostics.map((diagnostic) =>
        diagnostic.type === "cad_enclosure_aperture_intersection_warning"
          ? root.db.cad_enclosure_aperture_intersection_warning.insert(
              diagnostic,
            )
          : root.db.source_runtime_error.insert(diagnostic),
      )
    } catch (error) {
      if (run !== enclosure._assemblyDrcRun || enclosure.shouldBeRemoved) return
      const diagnostic = root.db.source_runtime_error.insert({
        error_type: "source_runtime_error",
        phase_name: "AssemblyDesignRuleChecks",
        message: `Enclosure aperture DRC could not complete: ${error instanceof Error ? error.message : String(error)}`,
      })
      enclosure._assemblyDrcDiagnostics = [diagnostic]
    }
  })
}
