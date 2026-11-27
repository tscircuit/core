import { loadImageSource } from "@tscircuit/image-utils"
import { assemblyStickerProps } from "@tscircuit/props"
import type { CadSticker } from "circuit-json"
import { mat3, vec3 } from "gl-matrix"
import { AssemblyComponent } from "../base-components/AssemblyComponent"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import { resolveAssemblyPartSurface } from "./resolve-assembly-part-surface"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"
import { resolveSurfaceMarkPlacement } from "./resolve-surface-mark-placement"

/** An adhesive sticker applied to one surface of its parent part. */
export class AssemblySticker extends AssemblyComponent<
  typeof assemblyStickerProps
> {
  cad_sticker_id: string | null = null

  get config() {
    return {
      componentName: "AssemblySticker",
      zodProps: assemblyStickerProps,
    }
  }

  private get part(): AssemblyPart | AssemblyPrintedPart {
    if (
      this.parent?.componentName !== "AssemblyPart" &&
      this.parent?.componentName !== "AssemblyPrintedPart"
    )
      throw new Error(
        `Sticker "${this.name}" must be a child of assembly.part or assembly.printedpart`,
      )
    return this.parent as AssemblyPart | AssemblyPrintedPart
  }

  doInitialSourceRender(): void {
    this.part
    this.source_component_id = this.root!.db.source_component.insert({
      ftype: "sticker",
      name: this.name,
      display_name: this._parsedProps.displayName,
    }).source_component_id
  }

  doInitialCadModelRender(): void {
    if (!this.root || this.root.pcbDisabled || !this.source_component_id) return
    const { db } = this.root
    const props = this._parsedProps
    const part = this.part
    const { width, height } = props
    if (width === undefined || height === undefined)
      throw new Error(
        `Sticker "${this.name}" needs both width and height. Sizing one from the image's aspect ratio is not supported yet`,
      )

    const surface = resolveAssemblyPartSurface(part, props.surfaceRef)
    const placement = resolveSurfaceMarkPlacement({
      placement: props,
      markWidth: width,
      markHeight: height,
      surface,
      markDescription: `Sticker "${this.name}"`,
    })

    // Surface frame, part-local: origin is a point, normal and X are unit
    // directions, and surface +Y is normal × X.
    const { origin, normal, xAxis } = surface.frame
    const yAxis = vec3.cross(vec3.create(), normal, xAxis)
    const localCenter = vec3.clone(origin)
    vec3.scaleAndAdd(localCenter, localCenter, xAxis, placement.x)
    vec3.scaleAndAdd(localCenter, localCenter, yAxis, placement.y)
    const localXAxis = vec3.create()
    vec3.scaleAndAdd(
      localXAxis,
      localXAxis,
      xAxis,
      Math.cos(placement.rotation),
    )
    vec3.scaleAndAdd(
      localXAxis,
      localXAxis,
      yAxis,
      Math.sin(placement.rotation),
    )

    // Part-local to circuit world (+X right, +Y top, +Z above, mm), using the
    // same finalized mounting transform as the part's geometry and reference
    // surfaces. Points take the full transform; directions only its rotation.
    const { transforms, subcircuitId } = resolvePrintedPartMounts(part)
    const world = transforms.get(part)!
    const rotation = mat3.fromMat4(mat3.create(), world)
    const toPoint = (vector: ArrayLike<number>) => ({
      x: vector[0]!,
      y: vector[1]!,
      z: vector[2]!,
    })
    const toDirection = (direction: ArrayLike<number>) =>
      toPoint(
        vec3.normalize(
          vec3.create(),
          vec3.transformMat3(vec3.create(), direction as vec3, rotation),
        ),
      )

    // circuit-json-util's table types predate cad_sticker.
    const stickers = (db as any).cad_sticker
    const sticker: CadSticker = stickers.insert({
      source_component_id: this.source_component_id,
      applied_to_source_component_id: part.source_component_id ?? undefined,
      center: toPoint(vec3.transformMat4(vec3.create(), localCenter, world)),
      normal_direction: toDirection(normal),
      x_axis_direction: toDirection(localXAxis),
      width,
      height,
      corner_radius: props.cornerRadius,
      thickness: props.thickness,
      background_color: props.backgroundColor,
      subcircuit_id: subcircuitId,
    } satisfies Omit<CadSticker, "type" | "cad_sticker_id">)
    this.cad_sticker_id = sticker.cad_sticker_id

    const { imageUrl } = props
    if (!imageUrl) return
    // The sticker's geometry is available immediately; its artwork is attached
    // once loaded.
    this._queueAsyncEffect("AssemblyStickerImageLoad", async () => {
      const image = await loadImageSource(imageUrl)
      stickers.update(sticker.cad_sticker_id, {
        image_asset: {
          project_relative_path: image.projectRelativePath,
          url: image.dataUrl,
          mimetype: image.mimetype,
        },
      } satisfies Pick<CadSticker, "image_asset">)
    })
  }
}
