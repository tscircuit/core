import { Fragment, type ReactElement } from "react"
import { applyToPoint, compose, rotateDEG, scale } from "transformation-matrix"

type SourcePad = {
  pin?: string | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  shape: string
}
type SourcePartData = {
  name: string
  value: string
  x: number
  y: number
  rotation: number
  layer: string
  pinLabels: Record<string, string[] | undefined>
  pads: SourcePad[]
}

/** Source pads are KiCad-local mm (+X right, +Y down). Bake their native
 * footprint rotation into core-local mm (+X right, +Y up), then let core place
 * the footprint at the source board-world position. originalLayer preserves
 * the source side without applying a second reflection to already-sided pads.
 */
export function SourcePart({ part }: { part: SourcePartData }): ReactElement {
  const pinLabels: Record<string, string[]> = Object.fromEntries(
    Object.entries(part.pinLabels).map(([pin, labels]) => {
      if (!labels) throw new Error(`Missing aliases for ${part.name}.${pin}`)
      return [pin, labels]
    }),
  )
  const transform = compose(rotateDEG(part.rotation), scale(1, -1))
  const footprint = (
    <footprint originalLayer={part.layer as "top" | "bottom"}>
      {part.pads.map((pad, padIndex) => {
        const point = applyToPoint(transform, { x: pad.x, y: pad.y })
        const placement = {
          pcbX: point.x,
          pcbY: point.y,
          portHints: pad.pin ? [pad.pin] : [],
        }
        return (
          <Fragment key={padIndex}>
            {pad.shape === "circle" ? (
              <smtpad {...placement} shape="circle" radius={pad.width / 2} />
            ) : (
              <smtpad
                {...placement}
                shape="rotated_rect"
                width={pad.width}
                height={pad.height}
                ccwRotation={pad.rotation}
              />
            )}
          </Fragment>
        )
      })}
    </footprint>
  )
  if (/^R\d+$/.test(part.name) && Object.keys(part.pinLabels).length === 2) {
    const resistance = part.value.match(/^\d+(?:\.\d+)?[RrKkMm]?/)
    if (!resistance)
      throw new Error(
        `Cannot parse source resistor ${part.name}: ${part.value}`,
      )
    return (
      <resistor
        name={part.name}
        resistance={resistance[0]}
        footprint={footprint}
        pcbX={part.x}
        pcbY={part.y}
        layer={part.layer as "top" | "bottom"}
      />
    )
  }
  if (/^C\d+$/.test(part.name) && Object.keys(part.pinLabels).length === 2) {
    return (
      <capacitor
        name={part.name}
        capacitance={part.value}
        footprint={footprint}
        pcbX={part.x}
        pcbY={part.y}
        layer={part.layer as "top" | "bottom"}
      />
    )
  }
  return (
    <chip
      name={part.name}
      manufacturerPartNumber={part.value}
      pinLabels={pinLabels}
      footprint={footprint}
      pcbX={part.x}
      pcbY={part.y}
      layer={part.layer as "top" | "bottom"}
      noSchematicRepresentation
    />
  )
}
