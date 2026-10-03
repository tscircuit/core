import { isValidElement, type ReactElement } from "react"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import type { AssemblyDeviceContainer } from "../base-components/is-assembly-device-container"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"
import { assemblyPrintedPartProps } from "@tscircuit/props"
import { renderToJscadPlan } from "jscad-fiber/headless"
import {
  resolveReferencePlanes,
  type JscadOperation,
  type NamedReferencePlane,
  type Vector3D,
} from "jscad-planner"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { renderAssemblyCadModel } from "./render-assembly-cad-model"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"

export class AssemblyPrintedPart
  extends PrimitiveComponent<typeof assemblyPrintedPartProps>
  implements AssemblyDeviceContainer
{
  isAssemblyDeviceContainer = true as const

  private compiledJscadInput?: ReactElement
  private compiledJscad?: {
    geometry: JscadOperation
    referencePlanes: NamedReferencePlane[]
  }

  get config() {
    return {
      componentName: "AssemblyPrintedPart",
      zodProps: assemblyPrintedPartProps,
    }
  }

  /** Part-local, right-handed XYZ in mm. Reference origins are points; normals
   * and X axes are directions. Compilation produces operations, never a mesh.
   */
  get printedPartPlan() {
    if (!this._parsedProps.jscad) return undefined
    if (
      !this.compiledJscad ||
      this.compiledJscadInput !== this._parsedProps.jscad
    ) {
      const { geometry, referencePlanes } = resolveReferencePlanes(
        renderToJscadPlan(this._parsedProps.jscad),
      )
      if (!geometry)
        throw new Error(
          `assembly.printedpart "${this.name}" needs solid geometry in addition to references`,
        )
      this.compiledJscad = { geometry, referencePlanes }
      this.compiledJscadInput = this._parsedProps.jscad
    }
    return this.compiledJscad
  }

  doInitialReactSubtreesRender(): void {
    if (isValidElement(this.props.cadModel))
      this.add(createInstanceFromReactElement(this.props.cadModel))
  }

  doInitialSourceRender(): void {
    this.printedPartPlan
    this.source_component_id = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
    }).source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    const plan = this.printedPartPlan
    if (!plan) {
      let model =
        resolveAssemblyModel(this._parsedProps) ?? this._parsedProps.cadModel
      const placement = resolveAssemblyPlacement(this)
      if (!model || (typeof model === "object" && "type" in model)) return
      if (typeof model === "object" && "jscad" in model) {
        const { geometry } = resolveReferencePlanes(
          model.jscad as JscadOperation,
        )
        if (!geometry)
          throw new Error(
            `assembly.printedpart "${this.name}" needs solid geometry in addition to references`,
          )
        model = { ...model, jscad: geometry }
      }
      this.cad_component_id = renderAssemblyCadModel(this, model, placement)
      return
    }
    const { transforms, subcircuitId } = resolvePrintedPartMounts(this)
    const transform = transforms.get(this)!
    // Bake only the part's world orientation into the operation tree. Keeping
    // translation in cad_component.position preserves the authored origin for
    // viewers. Both values use circuit world (+X right, +Y top, +Z above), mm.
    // Decompose the rigid frame using JSCAD rotate's Rz * Ry * Rx convention
    // (paired with jscad-planner resolveReferencePlanes). Emit a standard rotate
    // operation so viewers with older planners need no new matrix operation.
    const y = Math.asin(Math.max(-1, Math.min(1, -transform[2])))
    const angles: Vector3D =
      Math.abs(Math.cos(y)) > 1e-8
        ? [
            Math.atan2(transform[6], transform[10]),
            y,
            Math.atan2(transform[1], transform[0]),
          ]
        : [0, y, Math.atan2(-transform[4], transform[5])]
    this.cad_component_id = renderAssemblyCadModel(
      this,
      {
        jscad: { type: "rotate", angles, shape: plan.geometry },
      },
      {
        position: { x: transform[12], y: transform[13], z: transform[14] },
        pcbRotation: 0,
        layer: "top",
        subcircuit_id: subcircuitId,
      },
    )
  }
}
