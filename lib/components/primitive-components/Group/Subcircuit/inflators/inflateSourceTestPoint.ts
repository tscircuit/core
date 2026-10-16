import type {
  PcbComponent,
  SourcePort,
  SourceSimpleTestPoint,
} from "circuit-json"
import { TestPoint } from "lib/components/normal-components/TestPoint"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

const getLabels = (sourcePort: SourcePort | undefined) =>
  Array.from(
    new Set(
      [sourcePort?.name, ...(sourcePort?.port_hints ?? [])].filter(
        (label): label is string =>
          typeof label === "string" && label.length > 0,
      ),
    ),
  )

export function inflateSourceTestPoint(
  sourceElm: SourceSimpleTestPoint,
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

  const footprintVariant = sourceElm.footprint_variant
  const holeDiameter =
    sourceElm.hole_diameter ??
    (footprintVariant === "through_hole" ? 0.5 : undefined)

  const testPoint = new TestPoint({
    name: sourceElm.name,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
    displayName: sourceElm.display_name,
    footprintVariant,
    padShape: sourceElm.pad_shape,
    padDiameter: sourceElm.pad_diameter,
    holeDiameter,
    width: sourceElm.width,
    height: sourceElm.height,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  const sourcePorts = injectionDb.source_port
    .list()
    .filter(
      (port) => port.source_component_id === sourceElm.source_component_id,
    ) as SourcePort[]
  const portChild = testPoint.children.find((c) => c.componentName === "Port")
  if (portChild && "externallyAddedAliases" in portChild) {
    for (const sourcePort of sourcePorts) {
      for (const label of getLabels(sourcePort)) {
        if (!portChild.getNameAndAliases().includes(label)) {
          portChild.externallyAddedAliases.push(label)
        }
      }
    }
  }

  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: testPoint,
    })

    if (footprint) {
      for (const child of [...testPoint.children]) {
        if (child.isPcbPrimitive) {
          testPoint.remove(child)
        }
      }
      testPoint.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(testPoint)
  } else {
    subcircuit.add(testPoint)
  }
}
