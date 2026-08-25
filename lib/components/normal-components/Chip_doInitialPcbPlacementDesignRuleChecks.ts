import { checkConnectorAccessibleOrientation } from "@tscircuit/checks"
import { inferCableInsertionCenterForComponent } from "lib/utils/pcb/infer-cable-insertion-center-for-component"
import type { Chip } from "./Chip"

export const Chip_doInitialPcbPlacementDesignRuleChecks = (
  chip: Chip<string>,
) => {
  if (chip.root?.pcbDisabled) return
  if (!chip.name.toUpperCase().startsWith("J")) return
  if (!chip.pcb_component_id || !chip.source_component_id) return

  const placementDrcChecksDisabled =
    chip.root?.platform?.placementDrcChecksDisabled ??
    chip.getInheritedProperty("placementDrcChecksDisabled")
  const drcChecksDisabled =
    chip.root?.platform?.drcChecksDisabled ??
    chip.getInheritedProperty("drcChecksDisabled")
  if (placementDrcChecksDisabled || drcChecksDisabled) return

  const { db } = chip.root!
  const sourceChip = db.source_component.get(chip.source_component_id)
  if (sourceChip?.ftype !== "simple_chip") return

  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: chip.getSubcircuit().subcircuit_id })
    .toArray()
  const inferredCenter = inferCableInsertionCenterForComponent({
    circuitJson: subcircuitCircuitJson,
    pcbComponentId: chip.pcb_component_id,
    sourceComponentId: chip.source_component_id,
  })
  if (!inferredCenter) return

  // Supply connector metadata only to this check. The rendered generic chip
  // remains a chip and never receives a cable_insertion_center.
  const circuitJsonForOrientationCheck = subcircuitCircuitJson.map((element) =>
    element.type === "pcb_component" &&
    element.pcb_component_id === chip.pcb_component_id
      ? { ...element, cable_insertion_center: inferredCenter }
      : element,
  )

  const orientationWarning = checkConnectorAccessibleOrientation(
    circuitJsonForOrientationCheck,
  ).find((warning) => warning.pcb_component_id === chip.pcb_component_id)
  if (!orientationWarning) return

  const warningAlreadyExists = db
    .toArray()
    .some(
      (element) =>
        element.type === orientationWarning.type &&
        element.message === orientationWarning.message,
    )
  if (warningAlreadyExists) return

  db.insertAll([orientationWarning])
}
