import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import { loadImageSourceEffect } from "lib/effect/loading"
import { SVG_MIMETYPE } from "@tscircuit/image-utils"
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

    if (imageUrl !== undefined) {
      this._queueEffect("SchematicGraphicRender", (job) =>
        Effect.gen({ self: this }, function* () {
          if (this.root?.schematicDisabled) return

          // Static resolvers do not accept AbortSignal; abandon their wait safely.
          const resolvedImageUrl = yield* corePromise(
            () => resolveStaticFileImport(imageUrl, this.root?.platform),
            "resolve_schematic_image",
          )
          const sourceImage = yield* loadImageSourceEffect(
            resolvedImageUrl,
          ).pipe(
            Effect.catch((error) =>
              svgContent === undefined || resolvedImageUrl.startsWith("data:")
                ? Effect.fail(error)
                : Effect.succeed(null),
            ),
          )
          yield* coreSync(
            () =>
              job.commit(() => {
                if (sourceImage === null) {
                  const asset = {
                    project_relative_path: imageUrl.startsWith("data:")
                      ? "inline"
                      : imageUrl,
                    url: resolvedImageUrl,
                    mimetype: SVG_MIMETYPE,
                  } satisfies Asset
                  const schematicGraphic =
                    this.root!.db.schematic_graphic.insert({
                      asset,
                      schematic_sheet_id: this._resolveSchematicSheetId(),
                      svg_content: svgContent,
                      ...(width === undefined ? {} : { width }),
                      ...(height === undefined ? {} : { height }),
                    })

                  this.schematic_graphic_id =
                    schematicGraphic.schematic_graphic_id
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
                const fallbackSvgContent = sourceImage.dataUrl.startsWith(
                  "data:",
                )
                  ? svgContent
                  : sourceImage.text
                const schematicGraphic = this.root!.db.schematic_graphic.insert(
                  {
                    asset,
                    schematic_sheet_id: this._resolveSchematicSheetId(),
                    ...(fallbackSvgContent === undefined
                      ? {}
                      : { svg_content: fallbackSvgContent }),
                    ...(width === undefined ? {} : { width }),
                    ...(height === undefined ? {} : { height }),
                  },
                )

                this.schematic_graphic_id =
                  schematicGraphic.schematic_graphic_id
              }),
            "commit_schematic_graphic",
          )
        }),
      )
      return
    }

    if (svgContent !== undefined) {
      const asset = {
        project_relative_path: "inline",
        url: `data:image/svg+xml,${encodeURIComponent(svgContent)}`,
        mimetype: SVG_MIMETYPE,
      } satisfies Asset
      const schematicGraphic = db.schematic_graphic.insert({
        asset,
        schematic_sheet_id: this._resolveSchematicSheetId(),
        ...(width === undefined ? {} : { width }),
        ...(height === undefined ? {} : { height }),
      })

      this.schematic_graphic_id = schematicGraphic.schematic_graphic_id
    }
  }
}
