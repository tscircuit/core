type Selectable = {
  selectAll(selector: string): unknown[]
}

type CopperPourLike = {
  lowercaseComponentName?: string
  _parsedProps?: {
    unbroken?: boolean
  }
  pcb_copper_pour_ids?: string[]
}

const isCopperPourLike = (value: unknown): value is CopperPourLike =>
  typeof value === "object" && value !== null

export const getUnbrokenCopperPourIds = (
  selectable?: Selectable | null,
): Set<string> => {
  if (!selectable) return new Set()

  const unbrokenCopperPourIds = new Set<string>()

  for (const component of selectable.selectAll("copperpour")) {
    if (!isCopperPourLike(component)) continue
    if (component.lowercaseComponentName !== "copperpour") continue
    if (!component._parsedProps?.unbroken) continue

    for (const pcbCopperPourId of component.pcb_copper_pour_ids ?? []) {
      unbrokenCopperPourIds.add(pcbCopperPourId)
    }
  }

  return unbrokenCopperPourIds
}
