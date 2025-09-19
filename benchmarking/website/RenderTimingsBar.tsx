import { orderedRenderPhases } from "lib"
import React from "react"

export const RenderTimingsBar = ({
  phaseTimings,
}: {
  phaseTimings?: Record<string, number>
}) => {
  if (!phaseTimings) return null
  // Generate a color for each phase using HSL to ensure good distribution
  const getPhaseColor = (index: number) => {
    const hue = (index * 137.5) % 360 // Golden angle approximation
    return `hsl(${hue}, 70%, 50%)`
  }

  const totalTime = Object.values(phaseTimings).reduce(
    (sum, time) => sum + time,
    0,
  )

  return (
    <div className="space-y-2 w-full px-4">
      <div className="relative h-8 flex rounded-sm">
        {orderedRenderPhases.map((phase, index) => {
          const time = phaseTimings[phase] || 0
          const width = (time / totalTime) * 100

          return (
            <div
              key={phase}
              className="group relative overflow-visible"
              style={{
                width: `${width}%`,
                backgroundColor: getPhaseColor(index),
              }}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs whitespace-nowrap rounded bg-gray-900 text-white pointer-events-none">
                {phase}: {time.toFixed(1)}ms
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-xs text-gray-500">
        Total: {totalTime.toFixed(2)}ms
      </div>
    </div>
  )
}

export default RenderTimingsBar
