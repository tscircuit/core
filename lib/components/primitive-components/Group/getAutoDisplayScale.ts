import type { SimulationGraphWithSourceProbe } from "./InsertedSimulationGraph"
import { getFiniteBounds } from "./getFiniteBounds"
import { getGraphLevels } from "./getGraphLevels"

const DISPLAY_SECTION_HEIGHT_DIVS = 2
const DISPLAY_SECTION_DATA_FILL = 0.8

export const getAutoDisplayScale = ({
  graph,
  index,
  graphCount,
}: {
  graph: SimulationGraphWithSourceProbe
  index: number
  graphCount: number
}) => {
  const bounds = getFiniteBounds(getGraphLevels(graph))
  if (!bounds) return null

  const center = (bounds.min + bounds.max) / 2
  const span = bounds.max - bounds.min
  const valuePerDiv =
    span > 0
      ? span / (DISPLAY_SECTION_HEIGHT_DIVS * DISPLAY_SECTION_DATA_FILL)
      : Math.max(Math.abs(center) / 10, Number.EPSILON)

  return {
    display_center_value: center,
    display_center_offset_divs:
      ((graphCount - 1) / 2 - index) * DISPLAY_SECTION_HEIGHT_DIVS,
    value_per_div: valuePerDiv,
  }
}
