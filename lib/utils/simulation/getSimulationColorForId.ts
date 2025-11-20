const SIMULATION_COLOR_PALETTE = [
  "rgb(132, 0, 0)",
  "rgb(194, 194, 0)",
  "rgb(194, 0, 194)",
  "rgb(194, 0, 0)",
  "rgb(0, 132, 132)",
  "rgb(0, 132, 0)",
  "rgb(0, 0, 132)",
  "rgb(132, 132, 132)",
  "rgb(132, 0, 132)",
  "rgb(194, 194, 194)",
  "rgb(132, 0, 132)",
  "rgb(132, 0, 0)",
  "rgb(132, 132, 0)",
  "rgb(194, 194, 194)",
  "rgb(0, 0, 132)",
  "rgb(0, 132, 0)",
]

const idToColorMap = new Map<string, string>()
let colorIndex = 0

export function getSimulationColorForId(id: string): string {
  if (idToColorMap.has(id)) {
    const color = idToColorMap.get(id)!
    return color
  }
  const color = SIMULATION_COLOR_PALETTE[colorIndex]
  colorIndex = (colorIndex + 1) % SIMULATION_COLOR_PALETTE.length
  idToColorMap.set(id, color)
  return color
}

export function resetSimulationColorState(): void {
  idToColorMap.clear()
  colorIndex = 0
}
