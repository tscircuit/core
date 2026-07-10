import type { AnyCircuitElement } from "circuit-json"

const isImportedSymbolPrimitive = (
  elm: AnyCircuitElement,
): elm is Extract<
  AnyCircuitElement,
  {
    type:
      | "schematic_line"
      | "schematic_rect"
      | "schematic_circle"
      | "schematic_arc"
      | "schematic_text"
      | "schematic_path"
  }
> =>
  elm.type === "schematic_line" ||
  elm.type === "schematic_rect" ||
  elm.type === "schematic_circle" ||
  elm.type === "schematic_arc" ||
  elm.type === "schematic_text" ||
  elm.type === "schematic_path"

const getStringProp = (
  elm: AnyCircuitElement,
  propName: string,
): string | undefined => {
  if (!(propName in elm)) return undefined
  const rawProp = (elm as Record<string, string | undefined>)[propName]
  return typeof rawProp === "string" ? rawProp : undefined
}

export const selectSymbolCircuitJson = (
  circuitJson: readonly AnyCircuitElement[],
): AnyCircuitElement[] => {
  const schematicSymbols = circuitJson.filter(
    (elm): elm is Extract<AnyCircuitElement, { type: "schematic_symbol" }> =>
      elm.type === "schematic_symbol",
  )

  const schematicComponents = circuitJson.filter(
    (elm): elm is Extract<AnyCircuitElement, { type: "schematic_component" }> =>
      elm.type === "schematic_component",
  )

  const primarySymbolId =
    schematicComponents.find(
      (elm) => typeof elm.schematic_symbol_id === "string",
    )?.schematic_symbol_id ?? schematicSymbols[0]?.schematic_symbol_id

  const primaryComponent =
    (primarySymbolId
      ? schematicComponents.find(
          (elm) => elm.schematic_symbol_id === primarySymbolId,
        )
      : undefined) ?? schematicComponents[0]

  const primaryComponentId = primaryComponent?.schematic_component_id
  const primarySourceComponentId =
    typeof primaryComponent?.source_component_id === "string"
      ? primaryComponent.source_component_id
      : undefined

  const primarySymbol =
    (primarySymbolId
      ? schematicSymbols.find(
          (elm) => elm.schematic_symbol_id === primarySymbolId,
        )
      : undefined) ?? schematicSymbols[0]

  const relatedSourcePortIds = new Set<string>()
  const selected = new Set<AnyCircuitElement>()
  const selectedElements: AnyCircuitElement[] = []

  const add = (elm: AnyCircuitElement | undefined) => {
    if (!elm || selected.has(elm)) return
    selected.add(elm)
    selectedElements.push(elm)
  }

  add(primarySymbol)
  add(primaryComponent)

  for (const elm of circuitJson) {
    if (elm.type !== "schematic_port") continue
    if (
      !primaryComponentId ||
      elm.schematic_component_id !== primaryComponentId
    ) {
      continue
    }
    add(elm)
    if (typeof elm.source_port_id === "string") {
      relatedSourcePortIds.add(elm.source_port_id)
    }
  }

  for (const elm of circuitJson) {
    if (!isImportedSymbolPrimitive(elm)) continue

    const schematicSymbolId = getStringProp(elm, "schematic_symbol_id")
    const schematicComponentId = getStringProp(elm, "schematic_component_id")

    const isRelatedPrimitive =
      (primarySymbolId && schematicSymbolId === primarySymbolId) ||
      (primaryComponentId && schematicComponentId === primaryComponentId) ||
      (!primarySymbolId && !primaryComponentId)

    if (isRelatedPrimitive) {
      add(elm)
    }
  }

  for (const elm of circuitJson) {
    if (elm.type !== "source_port") continue

    if (
      relatedSourcePortIds.has(elm.source_port_id) ||
      (primarySourceComponentId &&
        elm.source_component_id === primarySourceComponentId)
    ) {
      add(elm)
    }
  }

  if (selectedElements.length > 0) {
    return selectedElements
  }

  return circuitJson.filter(
    (elm) =>
      elm.type === "schematic_symbol" ||
      elm.type === "schematic_component" ||
      elm.type === "schematic_port" ||
      isImportedSymbolPrimitive(elm),
  )
}
