import { normalizeDegrees } from "@tscircuit/math-utils"
import { type CadModelProp, cadModelBase, point3 } from "@tscircuit/props"
import type { CadComponent } from "circuit-json"
import { rotation } from "circuit-json"
import { mat4, vec3 } from "gl-matrix"
import type { Matrix4 } from "jscad-planner"
import { getAssemblyEulerAngles } from "./get-assembly-euler-angles"
import { constructAssetUrl } from "lib/utils/constructAssetUrl"
import type { ReactElement } from "react"
import {
  applyToPoint,
  compose,
  flipY,
  identity,
  rotate,
  translate,
} from "transformation-matrix"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyPlacement } from "./resolve-assembly-placement"

/** Render local CAD geometry at an assembly origin. Local points/offsets are mm
 * in the assembly's right-handed frame (+Z outward); transform into board-world
 * +X right, +Y top, +Z above. A bottom placement flips local X and Z, matching
 * transformFootprintInsertionDirectionVector and the emitted CAD Y rotation.
 */
export const renderAssemblyCadModel = (
  owner: PrimitiveComponent,
  model: Exclude<CadModelProp, ReactElement | null>,
  placement: AssemblyPlacement,
): CadComponent["cad_component_id"] => {
  const base = cadModelBase.parse(typeof model === "string" ? {} : model)
  const bottom = placement.layer === "bottom"
  const offset = point3.parse(base.positionOffset ?? { x: 0, y: 0, z: 0 })
  const transform = compose(
    translate(placement.position.x, placement.position.y),
    rotate((placement.pcbRotation * Math.PI) / 180),
    bottom ? flipY() : identity(),
  )
  const xy = applyToPoint(transform, offset)
  const authoredRotation = base.pcbRotationOffset ?? base.rotationOffset ?? 0
  const rotationOffset =
    typeof authoredRotation === "number"
      ? { x: 0, y: 0, z: authoredRotation }
      : {
          x: rotation.parse(authoredRotation.x),
          y: rotation.parse(authoredRotation.y),
          z: rotation.parse(authoredRotation.z),
        }
  const assetUrl = (url: string) =>
    constructAssetUrl(url, owner.root?.platform?.projectBaseUrl)
  // Face-mounted models may tilt out of the PCB plane. Transform their local
  // offset as a point and compose authored Rz * Ry * Rx inside the world frame.
  let mountedPosition: CadComponent["position"] | undefined
  let mountedRotation: CadComponent["rotation"] | undefined
  if (placement.worldTransform) {
    const point = vec3.transformMat4(
      [0, 0, 0],
      [offset.x, offset.y, offset.z + (base.zOffsetFromSurface ?? 0)],
      placement.worldTransform,
    )
    mountedPosition = { x: point[0], y: point[1], z: point[2] }
    const frame: Matrix4 = [...placement.worldTransform]
    mat4.rotateZ(frame, frame, (rotationOffset.z * Math.PI) / 180)
    mat4.rotateY(frame, frame, (rotationOffset.y * Math.PI) / 180)
    mat4.rotateX(frame, frame, (rotationOffset.x * Math.PI) / 180)
    const angles = getAssemblyEulerAngles(frame).map(
      (angle) => (angle * 180) / Math.PI,
    )
    mountedRotation = {
      x: angles[0],
      y: angles[1],
      z: normalizeDegrees(angles[2]),
    }
  }
  const urls =
    typeof model === "string"
      ? { footprinter_string: model }
      : {
          model_stl_url: "stlUrl" in model ? assetUrl(model.stlUrl) : undefined,
          model_obj_url: "objUrl" in model ? assetUrl(model.objUrl) : undefined,
          model_mtl_url:
            "mtlUrl" in model && model.mtlUrl
              ? assetUrl(model.mtlUrl)
              : undefined,
          model_gltf_url:
            "gltfUrl" in model ? assetUrl(model.gltfUrl) : undefined,
          model_glb_url: "glbUrl" in model ? assetUrl(model.glbUrl) : undefined,
          model_step_url: model.stepUrl ? assetUrl(model.stepUrl) : undefined,
          model_wrl_url: "wrlUrl" in model ? assetUrl(model.wrlUrl) : undefined,
          model_jscad: "jscad" in model ? model.jscad : undefined,
        }
  const cad = owner.root!.db.cad_component.insert({
    ...urls,
    position: mountedPosition ?? {
      ...xy,
      z:
        placement.position.z +
        (bottom ? -1 : 1) * (offset.z + (base.zOffsetFromSurface ?? 0)),
    },
    // Same CAD Euler convention as NormalComponent.doInitialCadModelRender:
    // bottom flips Y and negates the board-plane Z angle.
    rotation: mountedRotation ?? {
      x: rotationOffset.x,
      y: (bottom ? 180 : 0) + rotationOffset.y,
      z: normalizeDegrees(
        (bottom ? -1 : 1) * (placement.pcbRotation + rotationOffset.z),
      ),
    },
    layer: placement.layer,
    source_component_id: owner.source_component_id!,
    color:
      owner.componentName === "AssemblyPrintedPart"
        ? owner._parsedProps.color
        : undefined,
    subcircuit_id: placement.subcircuit_id,
    model_origin_position: base.modelOriginPosition ?? { x: 0, y: 0, z: 0 },
    model_unit_to_mm_scale_factor: base.modelUnitToMmScale ?? 1,
    model_object_fit: "contain_within_bounds",
    model_board_normal_direction: base.modelBoardNormalDirection,
    size: base.size,
    anchor_alignment: "center",
    show_as_translucent_model: base.showAsTranslucentModel ?? false,
  })
  return cad.cad_component_id
}
