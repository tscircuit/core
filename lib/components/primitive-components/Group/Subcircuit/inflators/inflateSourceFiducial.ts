import { fiducialProps } from "@tscircuit/props"
import type { PcbComponent, SourceSimpleFiducial } from "circuit-json"
import { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { Ftype } from "lib/utils/constants"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

class InflatedFiducial extends NormalComponent<typeof fiducialProps> {
  get config() {
    return {
      componentName: "Fiducial",
      zodProps: fiducialProps,
      sourceFtype: "simple_fiducial" as Ftype,
    }
  }

  doInitialSchematicComponentRender() {}
}

export function inflateSourceFiducial(
  sourceElm: SourceSimpleFiducial,
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
  const pcbSmtPad = injectionDb.pcb_smtpad
    .list({ pcb_component_id: pcbElm?.pcb_component_id })
    .find((elm) => elm.shape === "circle")
  const padDiameter =
    pcbSmtPad && "radius" in pcbSmtPad ? pcbSmtPad.radius * 2 : "1mm"

  const fiducial = new InflatedFiducial({
    name: sourceElm.name,
    padDiameter,
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
      normalComponent: fiducial,
    })

    if (footprint) {
      fiducial.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(fiducial)
  } else {
    subcircuit.add(fiducial)
  }
}
