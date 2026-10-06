import { source_component_availability_warning } from "circuit-json"
import {
  checkJlcPartAvailability,
  normalizeJlcPartNumber,
} from "lib/utils/jlc-part-availability"
import type { NormalComponent } from "./NormalComponent"

const availabilityChecks = new WeakMap<NormalComponent, { key: string }>()

export function NormalComponent_doInitialComponentAvailabilityWarning(
  component: NormalComponent,
  { refresh = false }: { refresh?: boolean } = {},
): void {
  const root = component.root
  const sourceComponentId = component.source_component_id
  if (!root || !sourceComponentId) return
  const { db } = root
  const sourceComponent = db.source_component.get(sourceComponentId)
  const partNumbers = [
    ...new Set(
      (sourceComponent?.supplier_part_numbers?.jlcpcb ?? [])
        .map((partNumber) => partNumber.trim().toUpperCase())
        .filter(Boolean)
        .map((partNumber) => normalizeJlcPartNumber(partNumber) ?? partNumber),
    ),
  ]
  const shouldCheck =
    root.platform?.checkAvailability === true &&
    !component.props.doNotPlace &&
    !component.getInheritedProperty("bomDisabled") &&
    !(
      root.platform?.drcChecksDisabled ??
      component.getInheritedProperty("drcChecksDisabled")
    ) &&
    partNumbers.length > 0
  const key = shouldCheck ? JSON.stringify(partNumbers) : "disabled"
  if (!refresh && availabilityChecks.get(component)?.key === key) return
  const check = { key }
  availabilityChecks.set(component, check)

  for (const warning of db.source_component_availability_warning.list({
    source_component_id: sourceComponentId,
  })) {
    db.source_component_availability_warning.delete(
      warning.source_component_availability_warning_id,
    )
  }
  if (!shouldCheck) return

  component._queueAsyncEffect("check-component-availability", async () => {
    const availability = await Promise.all(
      partNumbers.map((partNumber) => {
        const normalizedPartNumber = normalizeJlcPartNumber(partNumber)
        return normalizedPartNumber
          ? checkJlcPartAvailability(root, normalizedPartNumber)
          : Promise.resolve(false)
      }),
    )
    if (
      availabilityChecks.get(component) !== check ||
      availability.some(Boolean)
    )
      return
    if (root.platform?.checkAvailability !== true || component.shouldBeRemoved)
      return
    db.source_component_availability_warning.insert(
      source_component_availability_warning.parse({
        type: "source_component_availability_warning",
        source_component_id: sourceComponentId,
        subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
        supplier_name: "jlcpcb",
        supplier_part_numbers: partNumbers,
        message: `${component.name || "Unnamed component"} may not have availability from JLCPCB (${partNumbers.join(", ")}).`,
      }),
    )
  })
}
