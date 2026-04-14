import { cadModelProp, type CadModelProp } from "@tscircuit/props"
import type { AnyCircuitElement, CadComponent } from "circuit-json"

export const extractCadModelFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
): CadModelProp | undefined => {
  const cadComponent = circuitJson.find(
    (elm): elm is CadComponent => elm.type === "cad_component",
  )
  if (!cadComponent) return undefined

  const cadModelCandidate: Record<string, unknown> = {
    stlUrl: cadComponent.model_stl_url,
    objUrl: cadComponent.model_obj_url,
    gltfUrl: cadComponent.model_gltf_url,
    glbUrl: cadComponent.model_glb_url,
    stepUrl: cadComponent.model_step_url,
    wrlUrl: cadComponent.model_wrl_url,
    modelOriginPosition: cadComponent.model_origin_position ?? undefined,
    modelUnitToMmScale: cadComponent.model_unit_to_mm_scale_factor,
    modelBoardNormalDirection: cadComponent.model_board_normal_direction,
    size: cadComponent.size ?? undefined,
    rotationOffset: cadComponent.rotation ?? undefined,
    positionOffset: cadComponent.position ?? undefined,
    showAsTranslucentModel: cadComponent.show_as_translucent_model,
  }

  if (
    !cadModelCandidate.stlUrl &&
    !cadModelCandidate.objUrl &&
    !cadModelCandidate.gltfUrl &&
    !cadModelCandidate.glbUrl &&
    !cadModelCandidate.stepUrl &&
    !cadModelCandidate.wrlUrl &&
    !cadComponent.model_jscad
  ) {
    return undefined
  }

  if (
    cadComponent.model_jscad &&
    typeof cadComponent.model_jscad === "object"
  ) {
    cadModelCandidate.jscad = cadComponent.model_jscad
  }

  const parsedCadModel = cadModelProp.safeParse(cadModelCandidate)
  return parsedCadModel.success ? parsedCadModel.data : undefined
}
