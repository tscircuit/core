import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbSmtPad } from "circuit-json"

const CONVENTIONAL_MECHANICAL_VIA_LAND_PITCH_MM = 0.8
const MIN_GRID_AXIS_POSITION_COUNT = 4
const MIN_GRID_OCCUPANCY_RATIO = 0.75
const POSITION_TOLERANCE_MM = 1e-6
const JLCPCB_FINE_PITCH_REFERENCE_URL =
  "https://jlcpcb.com/blog/effective-escape-routing-strategies"

interface PcbFabricationProcessWarningInsert {
  warning_type: "pcb_fabrication_process_warning"
  message: string
  pcb_component_id: string
  source_component_id?: string
  pcb_board_id?: string
  land_pitch: number
  required_process: string
  manufacturer: string
  reference_url?: string
  subcircuit_id?: string
}

type CircuitJsonUtilWithFabricationProcessWarning = CircuitJsonUtilObjects & {
  pcb_fabrication_process_warning: {
    insert: (warning: PcbFabricationProcessWarningInsert) => void
  }
}

const getDistinctSortedPositions = (positions: number[]): number[] => {
  const sortedPositions = [...positions].sort((a, b) => a - b)
  const distinctPositions: number[] = []

  for (const position of sortedPositions) {
    const previousPosition = distinctPositions.at(-1)
    if (
      previousPosition === undefined ||
      Math.abs(position - previousPosition) > POSITION_TOLERANCE_MM
    ) {
      distinctPositions.push(position)
    }
  }

  return distinctPositions
}

const getMinimumPositionSpacing = (positions: number[]): number | null => {
  const distinctPositions = getDistinctSortedPositions(positions)
  if (distinctPositions.length < MIN_GRID_AXIS_POSITION_COUNT) return null

  let minimumSpacing = Number.POSITIVE_INFINITY
  for (let index = 1; index < distinctPositions.length; index++) {
    minimumSpacing = Math.min(
      minimumSpacing,
      distinctPositions[index]! - distinctPositions[index - 1]!,
    )
  }

  return minimumSpacing
}

export const getFinePitchLandArrayPitch = ({
  pads,
}: {
  pads: PcbSmtPad[]
}): number | null => {
  const centeredPads = pads.filter(
    (pad): pad is Exclude<PcbSmtPad, { shape: "polygon" }> =>
      pad.shape !== "polygon",
  )
  const distinctXPositions = getDistinctSortedPositions(
    centeredPads.map((pad) => pad.x),
  )
  const distinctYPositions = getDistinctSortedPositions(
    centeredPads.map((pad) => pad.y),
  )
  const gridPositionCount =
    distinctXPositions.length * distinctYPositions.length
  const gridOccupancyRatio = centeredPads.length / gridPositionCount
  if (gridOccupancyRatio < MIN_GRID_OCCUPANCY_RATIO) return null

  const xPitch = getMinimumPositionSpacing(distinctXPositions)
  const yPitch = getMinimumPositionSpacing(distinctYPositions)
  if (xPitch === null || yPitch === null) return null

  const landPitch = Math.max(xPitch, yPitch)
  if (
    landPitch + POSITION_TOLERANCE_MM >=
    CONVENTIONAL_MECHANICAL_VIA_LAND_PITCH_MM
  ) {
    return null
  }

  return Math.round(landPitch / POSITION_TOLERANCE_MM) * POSITION_TOLERANCE_MM
}

export const insertFinePitchFabricationWarnings = ({
  db,
  pcbBoardId,
}: {
  db: CircuitJsonUtilObjects
  pcbBoardId: string
}): void => {
  for (const pcbComponent of db.pcb_component.list()) {
    const alreadyHasFabricationWarning = db
      .toArray()
      .some(
        (element) =>
          element.type.includes("pcb_fabrication_process_warning") &&
          "pcb_component_id" in element &&
          element.pcb_component_id === pcbComponent.pcb_component_id,
      )
    if (alreadyHasFabricationWarning) continue

    const componentPads = db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
    const landPitch = getFinePitchLandArrayPitch({ pads: componentPads })
    if (landPitch === null) continue

    const sourceComponent = db.source_component.get(
      pcbComponent.source_component_id,
    )
    const componentName = sourceComponent?.name ?? pcbComponent.pcb_component_id

    const fabricationProcessWarning: PcbFabricationProcessWarningInsert = {
      warning_type: "pcb_fabrication_process_warning",
      message: `${componentName} uses a ${landPitch} mm two-dimensional land array. Generic geometry DRC does not qualify its fabrication process; JLCPCB documents laser microvias or via-in-pad for pitches below 0.8 mm.`,
      pcb_component_id: pcbComponent.pcb_component_id,
      source_component_id: pcbComponent.source_component_id,
      pcb_board_id: pcbBoardId,
      land_pitch: landPitch,
      required_process: "laser_microvia_or_via_in_pad",
      manufacturer: "jlcpcb",
      reference_url: JLCPCB_FINE_PITCH_REFERENCE_URL,
      subcircuit_id: pcbComponent.subcircuit_id,
    }

    // circuit-json #715 defines this collection. Keep the pinned consumer
    // usable before its generated package declarations are released.
    const fabricationWarningDb =
      db as CircuitJsonUtilWithFabricationProcessWarning
    fabricationWarningDb.pcb_fabrication_process_warning.insert(
      fabricationProcessWarning,
    )
  }
}
