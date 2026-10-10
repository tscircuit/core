import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { CourtyardCircle } from "lib/components/primitive-components/CourtyardCircle"
import { CourtyardOutline } from "lib/components/primitive-components/CourtyardOutline"
import { CourtyardRect } from "lib/components/primitive-components/CourtyardRect"
import { getBoundsOfPcbComponents } from "lib/utils/get-bounds-of-pcb-components"
import {
  applyToPoint,
  compose,
  decomposeTSR,
  identity,
  rotate,
  translate,
} from "transformation-matrix"

export type Courtyard = CourtyardRect | CourtyardCircle | CourtyardOutline

const isCourtyard = (primitive: PrimitiveComponent): primitive is Courtyard =>
  primitive instanceof CourtyardRect ||
  primitive instanceof CourtyardCircle ||
  primitive instanceof CourtyardOutline

/** Select the courtyard set belonging to this primitive container. */
export const resolveCourtyards = (
  container: Pick<NormalComponent, "children" | "isGroup">,
  footprintChildren: ReadonlySet<PrimitiveComponent>,
): Courtyard[] => {
  const explicitCourtyards = container.children.filter(
    (child): child is Courtyard =>
      isCourtyard(child) && !footprintChildren.has(child),
  )
  if (!container.isGroup && explicitCourtyards.length > 0)
    return explicitCourtyards

  const courtyards: Courtyard[] = []
  const collect = (primitives: PrimitiveComponent[]) => {
    for (const primitive of primitives) {
      if (isCourtyard(primitive)) courtyards.push(primitive)
      // Nested parts and groups resolve their own courtyard sets.
      if (!primitive.isPrimitiveContainer) collect(primitive.children)
    }
  }
  collect(container.children)
  return courtyards
}

/** Map pre-layout board-space points to the part's resolved board-space placement.
 * Both frames use +X right, +Y up and mm; translation applies to points only.
 */
export const resolveCourtyardLayoutTransform = (
  component: Pick<
    NormalComponent,
    | "children"
    | "root"
    | "pcb_component_id"
    | "_computePcbGlobalTransformBeforeLayout"
  >,
) => {
  if (!component.pcb_component_id) return identity()
  const pcbComponent = component.root?.db.pcb_component.get(
    component.pcb_component_id,
  )
  if (!pcbComponent) return identity()
  const bounds = getBoundsOfPcbComponents(component.children)
  const beforeLayoutTransform =
    component._computePcbGlobalTransformBeforeLayout()
  const beforeLayoutRotation = decomposeTSR(beforeLayoutTransform).rotation
    .angle
  const beforeLayoutCenter =
    bounds.width || bounds.height
      ? {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        }
      : applyToPoint(beforeLayoutTransform, { x: 0, y: 0 })
  return compose(
    translate(pcbComponent.center.x, pcbComponent.center.y),
    rotate((pcbComponent.rotation * Math.PI) / 180 - beforeLayoutRotation),
    translate(-beforeLayoutCenter.x, -beforeLayoutCenter.y),
  )
}
