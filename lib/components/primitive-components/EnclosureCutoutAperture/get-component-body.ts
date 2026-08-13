import type { EnclosureComponentBody } from "@tscircuit/create-fdm-enclosure"
import type { CadComponent, PcbComponent } from "circuit-json"
import type { PrimitiveComponent } from "../../base-components/PrimitiveComponent"

type Point3Like = { x?: number; y?: number; z?: number }

/**
 * How far the model reaches beyond the point that sits on the board surface.
 *
 * `model_origin_position` is that point, and `model_bounds` is the model's
 * extent in the same frame, so the difference along the board normal is the
 * reach. `size` cannot answer this: it carries the extent but not where the box
 * sits relative to the origin, and the box is generally not centered on it.
 *
 * Everything that merely *translates* the model -- `zOffsetFromSurface`,
 * `positionOffset.z`, the mounting layer -- is already composed into
 * `cad_component.position.z`, so the caller adds that rather than re-deriving
 * it here.
 */
const getModelReachAboveOrigin = ({
  cad,
  authoredModel,
}: {
  cad: CadComponent
  authoredModel?: Record<string, any>
}): number | undefined => {
  // `modelBounds` is staged in Props before it becomes durable Circuit JSON.
  // Prefer the eventual record field when present, but read the parsed prop in
  // this migration PR so Core can consume it without a schema fork.
  const bounds =
    ((cad as CadComponent & { model_bounds?: unknown }).model_bounds as
      | { min?: Point3Like; max?: Point3Like }
      | undefined) ?? authoredModel?.modelBounds
  const origin =
    (cad.model_origin_position as Point3Like | undefined) ??
    authoredModel?.modelOriginPosition
  if (!bounds?.min || !bounds?.max || !origin) return undefined

  // The model axis that leaves the board. Defaults to z+, matching the
  // renderer's own default in `getOrientationRotationForBoardNormal`.
  const normal =
    cad.model_board_normal_direction ??
    authoredModel?.modelBoardNormalDirection ??
    "z+"
  const axis = normal[0] as "x" | "y" | "z"
  if (axis !== "x" && axis !== "y" && axis !== "z") return undefined

  const min = bounds.min[axis]
  const max = bounds.max[axis]
  const at = origin[axis]
  if (min === undefined || max === undefined || at === undefined)
    return undefined

  // For a negative normal the model points the other way, so the reach runs
  // from the origin down to the minimum instead of up to the maximum.
  const reach = normal.endsWith("-") ? at - min : max - at
  return Number.isFinite(reach) && reach >= 0 ? reach : undefined
}

/**
 * Project the part's physical facts into the enclosure package's normalized
 * body envelope.
 *
 * Size, placement and rotation come from the emitted `cad_component`, the
 * normalized form every authoring path converges on. During this staged
 * migration only, measured `modelBounds` may still live solely in the parsed
 * object prop because Circuit JSON has not gained the durable field yet; that
 * one fact falls back to the owner prop and moves to the record in the later
 * schema PR.
 *
 * It also means the rotation and the Z datum are the ones the model is actually
 * rendered at: `rotation.z` already composes the footprint rotation with the
 * model's own `pcbRotationOffset`, and `position.z` already composes
 * `zOffsetFromSurface`, `positionOffset.z` and the mounting layer. Re-deriving
 * either here is how the two drift apart.
 *
 * Core reports what it canonically knows and does not decide what any of it
 * means for a cut: face selection and depth projection are enclosure policy,
 * which is why no face is taken here.
 */
export const getComponentBody = ({
  owner,
  pcbComponent,
  cadComponent,
  boardSurfaceZ,
}: {
  owner?: PrimitiveComponent | null
  pcbComponent: PcbComponent
  cadComponent: CadComponent | null | undefined
  /**
   * World Z of the surface the part is mounted on, so the model's reach is
   * measured from the board rather than from wherever its origin landed.
   */
  boardSurfaceZ: number
}): EnclosureComponentBody => {
  const cadModelProp = owner?._parsedProps?.cadModel
  const authoredModel =
    cadModelProp && typeof cadModelProp === "object"
      ? (cadModelProp as Record<string, any>)
      : undefined
  const size = (cadComponent?.size ?? authoredModel?.size) as
    | Point3Like
    | undefined
  const x = size?.x
  const y = size?.y
  const z = size?.z
  const reach = cadComponent
    ? getModelReachAboveOrigin({ cad: cadComponent, authoredModel })
    : undefined
  const originZ = cadComponent?.position?.z
  const aboveBoardHeight =
    reach !== undefined && originZ !== undefined
      ? reach + Math.abs(originZ - boardSurfaceZ)
      : undefined

  return {
    size: x !== undefined && y !== undefined ? { x, y, z } : undefined,
    aboveBoardHeight,
    rotation: cadComponent?.rotation?.z ?? pcbComponent.rotation ?? 0,
    footprint: {
      width: pcbComponent.width,
      height: pcbComponent.height,
    },
  }
}
