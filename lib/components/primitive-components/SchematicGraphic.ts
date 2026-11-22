import { getSchematicLengthUnitScale } from "@tscircuit/circuit-json-util"
import { LEGACY_SCHEMATIC_LENGTH_UNIT } from "circuit-json"
import { SVG_MIMETYPE, loadImageSource } from "@tscircuit/image-utils"
import { schematicGraphicProps } from "@tscircuit/props"
import type {
  Asset,
  SchematicGraphic as SchematicGraphicElement,
} from "circuit-json"
import { resolveStaticFileImport } from "lib/utils/resolveStaticFileImport"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class SchematicGraphic extends PrimitiveComponent<
  typeof schematicGraphicProps
> {
  isSchematicPrimitive = true

  schematic_graphic_id?: SchematicGraphicElement["schematic_graphic_id"]

  get config() {
    return {
      componentName: "SchematicGraphic",
      zodProps: schematicGraphicProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return

    const { db } = this.root!
    const { imageUrl, svgContent, width, height } = this._parsedProps

    // Graphics carry their own size and have no subcircuit_id in Circuit JSON.
    const unit = this._getSchematicLengthUnit()
    const scale = getSchematicLengthUnitScale(
      LEGACY_SCHEMATIC_LENGTH_UNIT,
      unit,
    )
    const geometry = {
      schematic_length_unit: unit,
      ...(width === undefined ? {} : { width: width * scale }),
      ...(height === undefined ? {} : { height: height * scale }),
    }
    if (imageUrl !== undefined) {
      this._queueAsyncEffect("SchematicGraphicRender", async () => {
        if (this.root?.schematicDisabled) return

        const resolvedImageUrl = await resolveStaticFileImport(
          imageUrl,
          this.root?.platform,
        )
        const sourceImage = await loadImageSource(resolvedImageUrl).catch(
          (error) => {
            if (
              svgContent === undefined ||
              resolvedImageUrl.startsWith("data:")
            ) {
              throw error
            }
            return null
          },
        )

        if (sourceImage === null) {
          const asset = {
            project_relative_path: imageUrl.startsWith("data:")
              ? "inline"
              : imageUrl,
            url: resolvedImageUrl,
            mimetype: SVG_MIMETYPE,
          } satisfies Asset
          const schematicGraphic = this.root!.db.schematic_graphic.insert({
            ...geometry,
            asset,
            schematic_sheet_id: this._resolveSchematicSheetId(),
            svg_content: svgContent,
          })

          this.schematic_graphic_id = schematicGraphic.schematic_graphic_id
          return
        }

        if (sourceImage.mimetype !== SVG_MIMETYPE) {
          throw new Error(
            `Unsupported imageUrl for SchematicGraphic: "${imageUrl}". Expected an SVG image.`,
          )
        }

        const asset = {
          project_relative_path: imageUrl.startsWith("data:")
            ? sourceImage.projectRelativePath
            : imageUrl,
          url: sourceImage.dataUrl,
          mimetype: sourceImage.mimetype,
        } satisfies Asset
        const fallbackSvgContent = sourceImage.dataUrl.startsWith("data:")
          ? svgContent
          : sourceImage.text
        const schematicGraphic = this.root!.db.schematic_graphic.insert({
          ...geometry,
          asset,
          schematic_sheet_id: this._resolveSchematicSheetId(),
          ...(fallbackSvgContent === undefined
            ? {}
            : { svg_content: fallbackSvgContent }),
        })

        this.schematic_graphic_id = schematicGraphic.schematic_graphic_id
      })
      return
    }

    if (svgContent !== undefined) {
      const asset = {
        project_relative_path: "inline",
        url: `data:image/svg+xml,${encodeURIComponent(svgContent)}`,
        mimetype: SVG_MIMETYPE,
      } satisfies Asset
      const schematicGraphic = db.schematic_graphic.insert({
        ...geometry,
        asset,
        schematic_sheet_id: this._resolveSchematicSheetId(),
      })

      this.schematic_graphic_id = schematicGraphic.schematic_graphic_id
    }
  }
}
