import { type PartsEngine, supplierProps } from "@tscircuit/props"
import { source_component_availability_warning } from "circuit-json"
import { checkPartAvailability } from "lib/utils/part-availability"
import type { NormalComponent } from "./NormalComponent"

const availabilityChecks = new WeakMap<
  NormalComponent,
  { key: string; partsEngine?: PartsEngine }
>()
const supplierNames =
  supplierProps.shape.supplierPartNumbers.unwrap().keySchema.options

export function NormalComponent_doInitialComponentAvailabilityWarning(
  component: NormalComponent,
  { refresh = false }: { refresh?: boolean } = {},
): void {
  const root = component.root
  const sourceComponentId = component.source_component_id
  if (!root || !sourceComponentId) return
  const { db } = root
  const sourceComponent = db.source_component.get(sourceComponentId)
  const partsEngine = component.getInheritedProperty("partsEngine") as
    | PartsEngine
    | undefined
  const supplierAlternatives = supplierNames
    .map((supplierName) => ({
      supplierName,
      partNumbers: [
        ...new Set(
          (sourceComponent?.supplier_part_numbers?.[supplierName] ?? [])
            .map((partNumber) => partNumber.trim())
            .filter(Boolean),
        ),
      ],
    }))
    .filter((supplier) => supplier.partNumbers.length > 0)
  const shouldCheck =
    root.platform?.checkAvailability === true &&
    !!partsEngine?.fetchPartAvailability &&
    !component.props.doNotPlace &&
    !component.getInheritedProperty("bomDisabled") &&
    !component.getInheritedProperty("partsEngineDisabled") &&
    !(
      root.platform?.drcChecksDisabled ??
      component.getInheritedProperty("drcChecksDisabled")
    ) &&
    supplierAlternatives.length > 0
  const key = shouldCheck ? JSON.stringify(supplierAlternatives) : "disabled"
  const previousCheck = availabilityChecks.get(component)
  if (
    !refresh &&
    previousCheck?.key === key &&
    previousCheck.partsEngine === partsEngine
  )
    return
  const check = { key, partsEngine }
  availabilityChecks.set(component, check)
  for (const warning of db.source_component_availability_warning.list({
    source_component_id: sourceComponentId,
  })) {
    db.source_component_availability_warning.delete(
      warning.source_component_availability_warning_id,
    )
  }
  if (!shouldCheck || !partsEngine) return
  component._queueAsyncEffect("check-component-availability", async () => {
    const availabilityBySupplier = await Promise.all(
      supplierAlternatives.map(async ({ supplierName, partNumbers }) => ({
        supplierName,
        partNumbers,
        availability: await Promise.all(
          partNumbers.map((supplierPartNumber) =>
            checkPartAvailability(root, {
              partsEngine,
              supplierName,
              supplierPartNumber,
            }),
          ),
        ),
      })),
    )
    if (
      availabilityChecks.get(component) !== check ||
      root.platform?.checkAvailability !== true ||
      component.shouldBeRemoved
    )
      return
    for (const {
      supplierName,
      partNumbers,
      availability,
    } of availabilityBySupplier) {
      if (availability.some((result) => result === true)) continue
      const checkedPartNumbers = partNumbers.filter(
        (_, index) => availability[index] !== undefined,
      )
      if (!checkedPartNumbers.length) continue
      db.source_component_availability_warning.insert(
        source_component_availability_warning.parse({
          type: "source_component_availability_warning",
          source_component_id: sourceComponentId,
          subcircuit_id: component.getSubcircuit()?.subcircuit_id ?? undefined,
          supplier_name: supplierName,
          supplier_part_numbers: checkedPartNumbers,
          message: `${component.name || "Unnamed component"} may not have availability from ${supplierName === "jlcpcb" ? "JLCPCB" : supplierName} (${checkedPartNumbers.join(", ")}).`,
        }),
      )
    }
  })
}
