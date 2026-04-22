const SIMULATION_COLOR_PALETTE = [
  // Start with the colors users most commonly expect from circuit sims.
  "rgb(0, 150, 0)",
  "rgb(0, 0, 220)",
  "rgb(220, 0, 0)",
  "rgb(0, 160, 160)",
  "rgb(180, 0, 180)",
  "rgb(170, 140, 0)",
  "rgb(220, 120, 0)",
  "rgb(128, 128, 128)",
  "rgb(100, 0, 180)",
  "rgb(140, 70, 0)",
  "rgb(220, 80, 120)",
  "rgb(0, 120, 220)",
  "rgb(0, 120, 120)",
  "rgb(120, 0, 0)",
  "rgb(0, 0, 132)",
  "rgb(80, 80, 80)",
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
