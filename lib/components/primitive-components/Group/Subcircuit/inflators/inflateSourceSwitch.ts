import type { PcbComponent, SourcePort, SourceSimpleSwitch } from "circuit-json"
import { Switch } from "lib/components/normal-components/Switch"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

type SwitchType = "spst" | "spdt" | "dpst" | "dpdt"

const getImportedSwitchProps = (
  sourceElm: SourceSimpleSwitch,
  inflatorContext: InflatorContext,
): {
  type: SwitchType
  pinLabels: Record<string, string[]> | undefined
} => {
  const sourcePorts = inflatorContext.injectionDb.source_port
    .list()
    .filter(
      (port) => port.source_component_id === sourceElm.source_component_id,
    ) as SourcePort[]

  const pinLabels: Record<string, string[]> = {}
  let highestPinNumber = 0

  for (const sourcePort of sourcePorts) {
    const pinNumber = sourcePort.pin_number
    if (pinNumber === undefined || pinNumber === null) continue

    highestPinNumber = Math.max(highestPinNumber, pinNumber)
    const labels = Array.from(
      new Set(
        [sourcePort.name, ...(sourcePort.port_hints ?? [])].filter(
          (label): label is string =>
            typeof label === "string" && label.length > 0,
        ),
      ),
    )
    if (labels.length > 0) {
      pinLabels[`pin${pinNumber}`] = labels
    }
  }

  let type: SwitchType = "spst"
  if (highestPinNumber >= 5) type = "dpdt"
  else if (highestPinNumber === 4) type = "dpst"
  else if (highestPinNumber === 3) type = "spdt"

  return {
    type,
    pinLabels: Object.keys(pinLabels).length > 0 ? pinLabels : undefined,
  }
}

export function inflateSourceSwitch(
  sourceElm: SourceSimpleSwitch,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const importedSwitchProps = getImportedSwitchProps(sourceElm, inflatorContext)
  const switchComponent = new Switch({
    name: sourceElm.name,
    displayName: sourceElm.display_name,
    ...importedSwitchProps,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: switchComponent,
    })

    if (footprint) {
      switchComponent.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(switchComponent)
  } else {
    subcircuit.add(switchComponent)
  }
}
