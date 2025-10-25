import { expect, test } from "bun:test"
import { getAllDimensionsForSchematicBox } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import "tests/fixtures/extend-expect-any-svg"

type Dimensions = ReturnType<typeof getAllDimensionsForSchematicBox>

const SCALE = 100
const MARGIN = 20
const GAP = 40
const LABEL_MARGIN = 30

type BoxRenderContext = {
  label: string
  spacing: number
  dimensions: Dimensions
  stroke: string
}

const createComparisonSvg = (
  base: BoxRenderContext,
  widened: BoxRenderContext,
) => {
  const baseSize = base.dimensions.getSize()
  const widenedSize = widened.dimensions.getSize()

  const maxWidth = Math.max(baseSize.width, widenedSize.width) * SCALE
  const baseHeight = baseSize.height * SCALE
  const widenedHeight = widenedSize.height * SCALE

  const viewBoxWidth = maxWidth + MARGIN * 2
  const viewBoxHeight =
    baseHeight + widenedHeight + GAP + MARGIN * 2 + LABEL_MARGIN * 2

  const baseX = MARGIN + (maxWidth - baseSize.width * SCALE) / 2
  const widenedX = MARGIN + (maxWidth - widenedSize.width * SCALE) / 2

  const baseY = MARGIN + LABEL_MARGIN
  const widenedY = baseY + baseHeight + GAP

  const widthLabel = (width: number) => width.toFixed(3)

  const drawBox = ({
    dimensions,
    stroke,
    spacing,
    label,
    x,
    y,
  }: BoxRenderContext & { x: number; y: number }) => {
    const size = dimensions.getSize()
    const rectWidth = size.width * SCALE
    const rectHeight = size.height * SCALE

    return `
      <g>
        <rect
          x="${x}"
          y="${y}"
          width="${rectWidth}"
          height="${rectHeight}"
          fill="none"
          stroke="${stroke}"
          stroke-width="2"
          rx="8"
          ry="8"
        />
        <text
          x="${viewBoxWidth / 2}"
          y="${
            y === baseY
              ? baseY - LABEL_MARGIN / 2
              : widenedY + rectHeight + LABEL_MARGIN / 2
          }"
          text-anchor="middle"
          font-family="monospace"
          font-size="16"
        >${label} (schPinSpacing=${spacing})</text>
        <text
          x="${viewBoxWidth / 2}"
          y="${y + rectHeight / 2 + 6}"
          text-anchor="middle"
          font-family="monospace"
          font-size="16"
        >width=${widthLabel(size.width)}</text>
      </g>
    `
  }

  return `
    <svg
      width="${viewBoxWidth}"
      height="${viewBoxHeight}"
      viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="${MARGIN / 2}"
        y="${MARGIN / 2}"
        width="${viewBoxWidth - MARGIN}"
        height="${viewBoxHeight - MARGIN}"
        fill="none"
        stroke="#c5c5c5"
        stroke-dasharray="6 6"
        stroke-width="1"
      />
      ${drawBox({ ...base, x: baseX, y: baseY })}
      ${drawBox({ ...widened, x: widenedX, y: widenedY })}
    </svg>
  `
}

test("schematic width remains stable when adjusting schPinSpacing", () => {
  const schPortArrangement = {
    leftSize: 2,
    rightSize: 2,
    topSize: 0,
    bottomSize: 0,
  } as const

  const baseSpacing = 0.2
  const widenedSpacing = 0.75

  const baseDimensions = getAllDimensionsForSchematicBox({
    schPinSpacing: baseSpacing,
    schPortArrangement,
    pinCount: 4,
  })

  const widenedSpacingDimensions = getAllDimensionsForSchematicBox({
    schPinSpacing: widenedSpacing,
    schPortArrangement,
    pinCount: 4,
  })

  const svg = createComparisonSvg(
    {
      label: "Baseline",
      spacing: baseSpacing,
      dimensions: baseDimensions,
      stroke: "#1b76ff",
    },
    {
      label: "Adjusted",
      spacing: widenedSpacing,
      dimensions: widenedSpacingDimensions,
      stroke: "#f97316",
    },
  )

  expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "schematic-pin-spacing-width-comparison",
  )
})
